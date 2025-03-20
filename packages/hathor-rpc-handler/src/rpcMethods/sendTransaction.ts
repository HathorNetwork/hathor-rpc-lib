/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';
import { constants, type HathorWallet } from '@hathor/wallet-lib';
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
import { validateNetwork } from '../helpers';

const sendTransactionSchema = z.object({
  method: z.literal(RpcMethods.SendTransaction),
  params: z.object({
    network: z.string().min(1),
    outputs: z.array(z.object({
      address: z.string().optional(),
      value: z.string().regex(/^\d+$/)
        .pipe(z.coerce.bigint().positive())
        .optional(),
      token: z.string().optional(),
      type: z.string().optional(),
      data: z.array(z.string()).optional(),
    })
    .transform(output => {
      // If data is present, automatically set type to 'data'
      if (output.data && output.data.length > 0 && !output.type) {
        output.type = 'data';
      }
      return output;
    })
    .refine((output) => {
      // If data is undefined, value must be defined
      if (output.data === undefined && output.value === undefined) {
        return false;
      }
      return true;
    }, {
      message: "Value is required when data is not provided"
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
 * @throws {InsufficientFundsError} If there are not enough funds to complete the transaction.
 */
export async function sendTransaction(
  rpcRequest: SendTransactionRpcRequest,
  wallet: HathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
): Promise<RpcResponse> {
  const validationResult = sendTransactionSchema.safeParse(rpcRequest);
  
  if (!validationResult.success) {
    throw new InvalidParamsError(validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
  }

  const { params } = validationResult.data;
  validateNetwork(wallet, params.network);

  // Transform outputs before sending to wallet-lib
  const transformedOutputs = params.outputs.map(output => {
    const result = { ...output };
    
    if (result.type === 'data' || (result.data && result.data.length > 0)) {
      result.value = BigInt(1);
      result.token = constants.NATIVE_TOKEN_UID;
    }
    
    return result;
  });

  // sendManyOutputsSendTransaction throws if it doesn't receive a pin,
  // but doesn't use it until prepareTxData is called, so we can just assign
  // an arbitrary value to it and then mutate the instance after we get the
  // actual pin from the pin prompt.
  const stubPinCode = '111111';

  // Create the transaction service but don't run it yet
  const sendTransaction = await wallet.sendManyOutputsSendTransaction(transformedOutputs, {
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

  // Show the complete transaction (with all inputs) to the user
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

  // Actually request the pin from the client
  const pinResponse = await promptHandler(pinPrompt, requestMetadata) as PinRequestResponse;

  if (!pinResponse.data.accepted) {
    throw new PromptRejectedError('User rejected PIN prompt');
  }

  const loadingTrigger: SendTransactionLoadingTrigger = {
    type: TriggerTypes.SendTransactionLoadingTrigger,
  };
  promptHandler(loadingTrigger, requestMetadata);

  // And then mutate the instance
  sendTransaction.pin = pinResponse.data.pinCode;

  try {
    // Now execute the prepared transaction
    const response = await sendTransaction.run();

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
