/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';
import { constants, Transaction } from '@hathor/wallet-lib';
import type { DataScriptOutputRequestObj, IHathorWallet } from '@hathor/wallet-lib';
import type { IDataOutput } from '@hathor/wallet-lib/lib/types';
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

  // sendManyOutputsSendTransaction throws if it doesn't receive a pin,
  // but doesn't use it until prepareTxData is called, so we can just assign
  // an arbitrary value to it and then mutate the instance after we get the
  // actual pin from the pin prompt.
  const stubPinCode = '111111';

  // Create the transaction service but don't run it yet
  const sendTransaction = await wallet.sendManyOutputsSendTransaction(params.outputs, {
    inputs: params.inputs || [],
    changeAddress: params.changeAddress,
    pinCode: stubPinCode,
  });

  // Prepare the transaction to get all inputs (including automatically selected ones)
  let preparedTx;
  try {
    preparedTx = await sendTransaction.prepareTxData();
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('Insufficient amount of tokens')) {
        throw new InsufficientFundsError(err.message);
      }
    }
    throw new PrepareSendTransactionError(err instanceof Error ? err.message : 'An unknown error occurred while preparing the transaction');
  }

  // Extract token UIDs from outputs and fetch their details
  const tokenUids = preparedTx.outputs
    .filter((output): output is IDataOutput & { token: string } => 'token' in output && typeof output.token === 'string')
    .map(output => output.token);
  const tokenDetails = await fetchTokenDetails(wallet, tokenUids);

  // Show the complete transaction (with all inputs) to the user
  const prompt: SendTransactionConfirmationPrompt = {
    ...rpcRequest,
    type: TriggerTypes.SendTransactionConfirmationPrompt,
    data: {
      outputs: preparedTx.outputs,
      inputs: preparedTx.inputs,
      changeAddress: params.changeAddress,
      tokenDetails,
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
    // Now execute the prepared transaction
    let response: Transaction | string;
    if (params.pushTx === false) {
      const transaction = await sendTransaction.run('prepare-tx', pinResponse.data.pinCode);
      response = transaction.toHex();
    } else {
      response = await sendTransaction.run(null, pinResponse.data.pinCode);
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
