/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';
import type { HathorWallet, Transaction } from '@hathor/wallet-lib';
import type { OutputSendTransaction } from '@hathor/wallet-lib/lib/wallet/types';
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
} from '../errors';
import { validateNetwork } from '../helpers';

const sendTransactionSchema = z.object({
  method: z.literal(RpcMethods.SendTransaction),
  params: z.object({
    network: z.string().min(1),
    outputs: z.array(z.object({
      address: z.string().optional(),
      value: z.string().transform(val => BigInt(val)),
      token: z.string().optional(),
      type: z.string().optional(),
      data: z.array(z.string()).optional(),
    })).min(1),
    inputs: z.array(z.object({
      txId: z.string(),
      index: z.number().nonnegative(),
    })).optional(),
    changeAddress: z.string().optional(),
  }),
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
 */
export async function sendTransaction(
  rpcRequest: SendTransactionRpcRequest,
  wallet: HathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
) {
  try {
    console.log('[sendTransaction] Starting transaction process');
    console.log('[sendTransaction] Request params:', JSON.stringify(rpcRequest.params, null, 2));

    const validatedRequest = sendTransactionSchema.parse(rpcRequest);
    const { params } = validatedRequest;
    // console.log('[sendTransaction] Validation passed, parsed params:', JSON.stringify(params, null, 2));

    validateNetwork(wallet, params.network);
    console.log('[sendTransaction] Network validation passed');

    try {
      // Prepare the transaction outputs
      console.log('[sendTransaction] Preparing transaction outputs');
      const sendTransactionOutputs = params.outputs.map(output => {
        const outputData = {
          address: output.address,
          value: output.value,
          token: output.token,
          type: output.type,
          data: output.data,
        };
        const typedOutput = outputData as unknown as OutputSendTransaction;

        if (typedOutput.type === 'data') {
          (typedOutput as unknown as { value: bigint }).value = BigInt(1);
          typedOutput.token = '00';
        }

        console.log('[sendTransaction] Prepared output:', {
          ...typedOutput,
          value: typedOutput.value.toString(),
        });

        return typedOutput;
      });

      // Create the transaction service but don't run it yet
      const sendTransaction = await wallet.sendManyOutputsSendTransaction(sendTransactionOutputs, {
        inputs: params.inputs || [],
        changeAddress: params.changeAddress,
        pinCode: '111111',
      });

      // Prepare the transaction to get all inputs (including automatically selected ones)
      console.log('[sendTransaction] Preparing transaction data');
      try {
        const preparedTx: Transaction = await sendTransaction.prepareTxData();
        console.log('[sendTransaction] Prepared Tx: ', preparedTx);
      } catch (err) {
        console.error('[sendTransaction] Error preparing transaction:', err);
        if (err instanceof Error) {
          // Check if the error is about insufficient funds
          if (err.message.includes('Insufficient amount of tokens')) {
            throw new InsufficientFundsError(err.message);
          }
          throw new SendTransactionError(err.message);
        }
        throw new SendTransactionError('An unknown error occurred while preparing the transaction');
      }

      // Show the complete transaction (with all inputs) to the user
      console.log('[sendTransaction] Creating confirmation prompt');
      const prompt: SendTransactionConfirmationPrompt = {
        type: TriggerTypes.SendTransactionConfirmationPrompt,
        method: rpcRequest.method,
        data: {
          outputs: params.outputs as unknown as Array<{
            address?: string;
            value: number;
            token?: string;
            type?: string;
            data?: string[];
          }>,
          // @ts-expect-error Transaction inputs type mismatch with prompt interface
          inputs: preparedTx.inputs,
          changeAddress: params.changeAddress,
        }
      };

      const sendResponse = await promptHandler(prompt, requestMetadata) as SendTransactionConfirmationResponse;

      if (!sendResponse.data.accepted) {
        throw new PromptRejectedError('User rejected send transaction prompt');
      }

      const pinPrompt: PinConfirmationPrompt = {
        type: TriggerTypes.PinConfirmationPrompt,
        method: rpcRequest.method,
      };

      const pinResponse = await promptHandler(pinPrompt, requestMetadata) as PinRequestResponse;

      if (!pinResponse.data.accepted) {
        throw new PromptRejectedError('User rejected PIN prompt');
      }

      const loadingTrigger: SendTransactionLoadingTrigger = {
        type: TriggerTypes.SendTransactionLoadingTrigger,
      };
      promptHandler(loadingTrigger, requestMetadata);

      sendTransaction.pin = pinResponse.data.pinCode;

      // Now execute the prepared transaction
      const response = await sendTransaction.run();

      const loadingFinishedTrigger: SendTransactionLoadingFinishedTrigger = {
        type: TriggerTypes.SendTransactionLoadingFinishedTrigger,
      };
      promptHandler(loadingFinishedTrigger, requestMetadata);
      console.log('[sendTransaction] Loading finished trigger sent');

      return {
        type: RpcResponseTypes.SendTransactionResponse,
        response,
      } as RpcResponse;
    } catch (err) {
      console.error('[sendTransaction] Error in transaction execution:', err);
      if (err instanceof Error) {
        throw new SendTransactionError(err.message);
      } else {
        throw new SendTransactionError('An unknown error occurred while sending the transaction');
      }
    }
  } catch (err) {
    console.error('[sendTransaction] Error in main try block:', err);
    if (err instanceof z.ZodError) {
      throw new InvalidParamsError(err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    throw err;
  }
} 
