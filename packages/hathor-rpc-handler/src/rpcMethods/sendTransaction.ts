/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';
import type { HathorWallet } from '@hathor/wallet-lib';
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
import { PromptRejectedError, InvalidParamsError } from '../errors';
import { validateNetwork } from '../helpers';

const sendTransactionSchema = z.object({
  method: z.literal(RpcMethods.SendTransaction),
  params: z.object({
    network: z.string().min(1),
    outputs: z.array(z.object({
      address: z.string().optional(),
      value: z.number().positive(),
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
 */
export async function sendTransaction(
  rpcRequest: SendTransactionRpcRequest,
  wallet: HathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
) {
  try {
    const validatedRequest = sendTransactionSchema.parse(rpcRequest);
    const { params } = validatedRequest;

    validateNetwork(wallet, params.network);

    const prompt: SendTransactionConfirmationPrompt = {
      type: TriggerTypes.SendTransactionConfirmationPrompt,
      method: rpcRequest.method,
      data: {
        outputs: params.outputs,
        inputs: params.inputs,
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

    try {
      const response = await wallet.sendManyOutputsTransaction(
        params.outputs,
        {
          inputs: params.inputs,
          changeAddress: params.changeAddress,
          pinCode: pinResponse.data.pinCode,
        }
      );

      const loadingFinishedTrigger: SendTransactionLoadingFinishedTrigger = {
        type: TriggerTypes.SendTransactionLoadingFinishedTrigger,
      };
      promptHandler(loadingFinishedTrigger, requestMetadata);

      return {
        type: RpcResponseTypes.SendTransactionResponse,
        response,
      } as RpcResponse;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      } else {
        throw new Error('An unknown error occurred while sending the transaction');
      }
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new InvalidParamsError(err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    throw err;
  }
} 