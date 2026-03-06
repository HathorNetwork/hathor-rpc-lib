/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';
import { constants, Transaction, tokensUtils } from '@hathor/wallet-lib';
import type { DataScriptOutputRequestObj, IHathorWallet } from '@hathor/wallet-lib';
import {
  TriggerTypes,
  PinConfirmationPrompt,
  PinRequestResponse,
  TriggerHandler,
  RequestMetadata,
  SendTransactionRpcRequest,
  SendTransactionConfirmationPrompt,
  SendTransactionConfirmationResponse,
  SendTransactionLoadingTrigger,
  SendTransactionLoadingFinishedTrigger,
  RpcResponseTypes,
  RpcResponse,
  RpcMethods,
} from '../types';
import {
  PromptRejectedError,
  InvalidParamsError,
  SendTransactionError,
  InsufficientFundsError,
  PrepareSendTransactionError,
} from '../errors';
import { validateNetwork, fetchTokenDetails } from '../helpers';

/**
 * Unified send transaction interface for both HathorWallet and HathorWalletServiceWallet.
 *
 * Both wallet implementations provide sendTransaction services that support
 * a prepare-then-sign flow through this interface. This allows building the
 * transaction before requesting user confirmation, then signing with the PIN
 * only after approval.
 *
 * TODO: Remove this once wallet-lib exports a unified ISendTransaction with
 * prepareTx/signTx (see hathor-wallet-lib PR #1022).
 */
interface ISendTransactionObject {
  prepareTx(): Promise<Transaction>;
  signTx(pin: string): Promise<Transaction>;
  runFromMining(): Promise<Transaction>;
}

const OutputValueSchema = z.object({
  address: z.string(),
  value: z.string().regex(/^\d+$/)
    .pipe(z.coerce.bigint().positive()),
  token: z.string().default(constants.NATIVE_TOKEN_UID),
  timelock: z.number().optional(),
});

const OutputDataSchema = z.object({
  type: z.string().optional(),
  data: z.string().min(1),
}).transform((output): DataScriptOutputRequestObj => ({
  type: 'data',
  data: output.data,
}));

const OutputSchema = z.union([OutputValueSchema, OutputDataSchema]);

const ParamsSchema = z.object({
  network: z.string().min(1),
  outputs: z.array(OutputSchema).min(1),
  inputs: z.array(z.object({
    txId: z.string(),
    index: z.number().nonnegative(),
  })).optional(),
  changeAddress: z.string().optional(),
  push_tx: z.boolean().default(true),
}).transform((params) => ({
  ...params,
  pushTx: params.push_tx,
}));

const sendTransactionSchema = z.object({
  method: z.literal(RpcMethods.SendTransaction),
  params: ParamsSchema,
});

/**
 * Handles the 'htr_sendTransaction' RPC request by prompting the user for confirmation
 * and sending the transaction if confirmed.
 * 
 * @param rpcRequest - The RPC request object containing the transaction details.
 * @param wallet - The Hathor wallet instance used to send the transaction.
 * @param requestMetadata - Metadata related to the dApp that sent the RPC
 * @param promptHandler - The function to handle prompting the user for confirmation.
 *
 * @returns The transaction details if successful.
 *
 * @throws {PromptRejectedError} If the user rejects any of the prompts.
 * @throws {InvalidParamsError} If the request parameters are invalid.
 * @throws {SendTransactionError} If there's an error preparing or sending the transaction.
 * @throws {InsufficientFundsError} If there are not enough funds to complete the transaction.
 */
export async function sendTransaction(
  rpcRequest: SendTransactionRpcRequest,
  wallet: IHathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
): Promise<RpcResponse> {
  const validationResult = sendTransactionSchema.safeParse(rpcRequest);

  if (!validationResult.success) {
    throw new InvalidParamsError(validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
  }

  const { params } = validationResult.data;
  validateNetwork(wallet, params.network);

  // Create the transaction service and cast to the unified interface that works
  // with both HathorWallet (SendTransaction) and HathorWalletServiceWallet
  // (SendTransactionWalletService) implementations.
  const sendTransactionObject = await wallet.sendManyOutputsSendTransaction(params.outputs, {
    inputs: params.inputs || [],
    changeAddress: params.changeAddress,
  }) as unknown as ISendTransactionObject;

  // Prepare the full transaction without signing to get inputs, outputs, and fee.
  // This builds the tx so we can show it to the user for confirmation before
  // requesting their PIN.
  let preparedTx: Transaction;
  try {
    preparedTx = await sendTransactionObject.prepareTx();
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('Insufficient amount of tokens')) {
        throw new InsufficientFundsError(err.message);
      }
    }
    throw new PrepareSendTransactionError(err instanceof Error ? err.message : 'An unknown error occurred while preparing the transaction');
  }

  // Extract token UIDs from the user's requested outputs and fetch their details
  const tokenUids = params.outputs.reduce<string[]>((acc, output) => {
    if ('token' in output && typeof output.token === 'string' && output.token !== constants.NATIVE_TOKEN_UID) {
      acc.push(output.token);
    }
    return acc;
  }, []);
  const tokenDetails = await fetchTokenDetails(wallet, tokenUids);

  // Calculate network fee: fee header (fee-based tokens) + data output fees.
  // We expect all fees to be paid in HTR (tokenIndex 0).
  const feeHeader = preparedTx.getFeeHeader();
  if (feeHeader && feeHeader.entries.some(entry => entry.tokenIndex !== 0)) {
    throw new PrepareSendTransactionError('Unexpected fee entry with non-HTR token index');
  }
  const feeHeaderAmount = feeHeader
    ? feeHeader.entries.filter(entry => entry.tokenIndex === 0).reduce((sum, entry) => sum + entry.amount, 0n)
    : 0n;
  const dataOutputCount = params.outputs.filter(output => 'data' in output).length;
  const fee = feeHeaderAmount + tokensUtils.getDataFee(dataOutputCount);

  // Show the user's original parameters for confirmation
  const prompt: SendTransactionConfirmationPrompt = {
    ...rpcRequest,
    type: TriggerTypes.SendTransactionConfirmationPrompt,
    data: {
      changeAddress: params.changeAddress,
      pushTx: params.pushTx,
      tokenDetails,
      fee,
      preparedTx,
    }
  };

  const sendResponse = await promptHandler(prompt, requestMetadata) as SendTransactionConfirmationResponse;

  if (!sendResponse.data.accepted) {
    throw new PromptRejectedError('User rejected send transaction prompt');
  }

  const pinPrompt: PinConfirmationPrompt = {
    ...rpcRequest,
    type: TriggerTypes.PinConfirmationPrompt,
  };

  // Actually request the pin from the client
  const pinResponse = await promptHandler(pinPrompt, requestMetadata) as PinRequestResponse;

  if (!pinResponse.data.accepted) {
    throw new PromptRejectedError('User rejected PIN prompt');
  }

  const loadingTrigger: SendTransactionLoadingTrigger = {
    type: TriggerTypes.SendTransactionLoadingTrigger,
  };
  promptHandler(loadingTrigger, requestMetadata);

  try {
    // Sign the prepared transaction with the user's PIN
    const signedTx = await sendTransactionObject.signTx(pinResponse.data.pinCode);

    let response: Transaction | string;
    if (params.pushTx === false) {
      // Return the signed transaction as hex without mining/pushing
      response = signedTx.toHex();
    } else {
      // Mine and push the signed transaction
      response = await sendTransactionObject.runFromMining();
    }

    const loadingFinishedTrigger: SendTransactionLoadingFinishedTrigger = {
      type: TriggerTypes.SendTransactionLoadingFinishedTrigger,
    };
    promptHandler(loadingFinishedTrigger, requestMetadata);

    return {
      type: RpcResponseTypes.SendTransactionResponse,
      response,
    } as RpcResponse;
  } catch (err) {
    throw new SendTransactionError(err instanceof Error ? err.message : 'An unknown error occurred while sending the transaction');
  }
} 
