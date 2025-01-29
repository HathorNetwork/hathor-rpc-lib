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
  SendNanoContractRpcRequest,
  SendNanoContractTxConfirmationPrompt,
  SendNanoContractTxConfirmationResponse,
  SendNanoContractTxLoadingTrigger,
  RpcResponseTypes,
  RpcResponse,
  SendNanoContractTxLoadingFinishedTrigger,
} from '../types';
import { PromptRejectedError, SendNanoContractTxError, InvalidParamsError } from '../errors';
import { NanoContractAction } from '@hathor/wallet-lib/lib/nano_contracts/types';

const sendNanoContractSchema = z.object({
  method: z.string().min(1),
  blueprint_id: z.string().nullable(),
  nc_id: z.string().nullable(),
  actions: z.array(z.custom<NanoContractAction>()),
  args: z.array(z.unknown()).default([]),
  push_tx: z.boolean().default(true),
}).refine(
  (data) => data.blueprint_id || data.nc_id,
  "Either blueprint_id or nc_id must be provided"
);

/**
 * Sends a nano contract transaction.
 *
 * This function prompts the user for a PIN code and address, then uses these 
 * to create and send a nano contract transaction based on the provided parameters.
 *
 * @param rpcRequest - The RPC request containing transaction details.
 * @param wallet - The wallet instance to create/send the transaction.
 * @param requestMetadata - Metadata related to the dApp that sent the RPC
 * @param triggerHandler - The handler to manage user prompts.
 *
 * @returns The response from the transaction.
 *
 * @throws {SendNanoContractTxError} - If the transaction fails.
 */
export async function sendNanoContractTx(
  rpcRequest: SendNanoContractRpcRequest,
  wallet: HathorWallet,
  requestMetadata: RequestMetadata,
  triggerHandler: TriggerHandler,
) {
  try {
    const params = sendNanoContractSchema.parse(rpcRequest.params);
    
    const pinPrompt: PinConfirmationPrompt = {
      type: TriggerTypes.PinConfirmationPrompt,
      method: rpcRequest.method,
    };

    const sendNanoContractTxPrompt: SendNanoContractTxConfirmationPrompt = {
      type: TriggerTypes.SendNanoContractTxConfirmationPrompt,
      method: rpcRequest.method,
      data: {
        blueprintId: params.blueprint_id,
        ncId: params.nc_id,
        actions: params.actions as NanoContractAction[],
        method: params.method,
        args: params.args,
        pushTx: params.push_tx,
      },
    };

    const sendNanoContractTxResponse = await triggerHandler(sendNanoContractTxPrompt, requestMetadata) as SendNanoContractTxConfirmationResponse;

    if (!sendNanoContractTxResponse.data.accepted) {
      throw new PromptRejectedError();
    }

    const {
      caller,
      blueprintId: confirmedBluePrintId,
      actions: confirmedActions,
      args: confirmedArgs,
    } = sendNanoContractTxResponse.data.nc;

    const pinCodeResponse: PinRequestResponse = (await triggerHandler(pinPrompt, requestMetadata)) as PinRequestResponse;

    if (!pinCodeResponse.data.accepted) {
      throw new PromptRejectedError('Pin prompt rejected');
    }

    const sendMethod = params.push_tx 
      ? wallet.createAndSendNanoContractTransaction.bind(wallet)
      : wallet.createNanoContractTransaction.bind(wallet);

    try {
      const sendNanoContractLoadingTrigger: SendNanoContractTxLoadingTrigger = {
        type: TriggerTypes.SendNanoContractTxLoadingTrigger,
      };
      triggerHandler(sendNanoContractLoadingTrigger, requestMetadata);

      const response = await sendMethod(
        params.method,
        caller, 
        {
          ncId: params.nc_id,
          blueprintId: confirmedBluePrintId,
          actions: confirmedActions,
          args: confirmedArgs,
        }, 
        {
          pinCode: pinCodeResponse.data.pinCode,
        }
      );

      const sendNanoContractLoadingFinishedTrigger: SendNanoContractTxLoadingFinishedTrigger = {
        type: TriggerTypes.SendNanoContractTxLoadingFinishedTrigger,
      };
      triggerHandler(sendNanoContractLoadingFinishedTrigger, requestMetadata);

      return {
        type: RpcResponseTypes.SendNanoContractTxResponse,
        response,
      } as RpcResponse;
    } catch (err) {
      if (err instanceof Error) {
        throw new SendNanoContractTxError(err.message);
      } else {
        throw new SendNanoContractTxError('An unknown error occurred');
      }
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new InvalidParamsError(err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    throw err;
  }
}
