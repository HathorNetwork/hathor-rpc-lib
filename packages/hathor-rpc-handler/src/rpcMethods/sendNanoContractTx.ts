/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';
import type { HathorWallet, SendTransaction } from '@hathor/wallet-lib';
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
import { NanoContractAction, NanoContractActionType } from '@hathor/wallet-lib/lib/nano_contracts/types';
import NanoContract from '@hathor/wallet-lib/lib/nano_contracts/nano_contract';

export type NanoContractActionWithStringAmount = Omit<NanoContractAction, 'amount'> & {
  amount: string,
}

const NanoContractActionSchema = z.object({
  type: z.nativeEnum(NanoContractActionType),
  token: z.string(),
  amount: z.string().regex(/^\d+$/)
    .pipe(z.coerce.bigint().positive()),
  address: z.string().nullish().default(null),
  changeAddress: z.string().nullish().default(null),
});

const sendNanoContractSchema = z.object({
  method: z.string().min(1),
  blueprint_id: z.string().nullish(),
  nc_id: z.string().nullish(),
  actions: z.array(NanoContractActionSchema),
  args: z.array(z.unknown()).default([]),
  push_tx: z.boolean().default(true),
}).transform(data => ({
  ...data,
  blueprintId: data.blueprint_id || null,
  ncId: data.nc_id || null,
  pushTx: data.push_tx,
})).refine(
  (data) => data.blueprintId || data.ncId,
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
        blueprintId: params.blueprintId,
        ncId: params.ncId,
        actions: params.actions,
        method: params.method,
        args: params.args,
        pushTx: params.pushTx,
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

    try {
      const sendNanoContractLoadingTrigger: SendNanoContractTxLoadingTrigger = {
        type: TriggerTypes.SendNanoContractTxLoadingTrigger,
      };
      triggerHandler(sendNanoContractLoadingTrigger, requestMetadata);

      const txData = {
        ncId: params.ncId,
        blueprintId: confirmedBluePrintId,
        actions: confirmedActions,
        args: confirmedArgs,
      };

      let response: NanoContract | string;

      if (params.pushTx) {
        // If pushTx is true, create and send the transaction directly
        response = await wallet.createAndSendNanoContractTransaction(
          params.method,
          caller,
          txData,
          {
            pinCode: pinCodeResponse.data.pinCode,
          },
        );
      } else {
        // Otherwise, just create the transaction object
        const sendTransactionObj = await wallet.createNanoContractTransaction(
          params.method,
          caller,
          txData,
          {
            pinCode: pinCodeResponse.data.pinCode,
          },
        );

        if (!sendTransactionObj.transaction) {
          // This should never happen, but we'll check anyway
          throw new SendNanoContractTxError('Unable to create transaction object');
        }
        // Convert the transaction object to hex format for the response
        response = sendTransactionObj.transaction.toHex();
      }

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
