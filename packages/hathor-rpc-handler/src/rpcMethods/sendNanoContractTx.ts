/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';
import type { IHathorWallet, Transaction } from '@hathor/wallet-lib';
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
import { INanoContractActionSchema, NanoContractAction, ncApi, nanoUtils, Network, config } from '@hathor/wallet-lib';
import { fetchTokenDetails } from '../helpers';

export type NanoContractActionWithStringAmount = Omit<NanoContractAction, 'amount'> & {
  amount: string,
}

const sendNanoContractSchema = z.object({
  network: z.string().min(1),
  method: z.string().min(1),
  blueprint_id: z.string().nullish(),
  nc_id: z.string().nullish(),
  actions: z.array(INanoContractActionSchema),
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
  wallet: IHathorWallet,
  requestMetadata: RequestMetadata,
  triggerHandler: TriggerHandler,
) {
  try {
    const params = sendNanoContractSchema.parse(rpcRequest.params);

    const pinPrompt: PinConfirmationPrompt = {
      ...rpcRequest,
      type: TriggerTypes.PinConfirmationPrompt,
    };

    let blueprintId = params.blueprintId;
    if (blueprintId) {
      // Check if the user sent a valid blueprint id
      try {
        await ncApi.getBlueprintInformation(blueprintId);
      } catch (e) {
        // Invalid blueprint id
        throw new SendNanoContractTxError(
          `Invalid blueprint ID ${blueprintId}`
        );
      }
    }

    if (!blueprintId) {
      try {
        blueprintId = await nanoUtils.getBlueprintId(params.ncId!, wallet);
      } catch {
        // Error getting blueprint ID
        throw new SendNanoContractTxError(
          `Error getting blueprint id with nc id ${params.ncId} from the full node`
        );
      }
    }

    config.setServerUrl(wallet.getServerUrl());
    const result = await nanoUtils.validateAndParseBlueprintMethodArgs(blueprintId!, params.method, params.args, new Network(params.network));
    const parsedArgs = result.map((data) => {
      return { ...data, parsed: data.field.toUser() };
    });

    // Extract token UIDs from actions and fetch their details
    const tokenUids = params.actions
      .filter((action): action is NanoContractAction & { token: string } => 'token' in action && typeof action.token === 'string')
      .map(action => action.token);
    const tokenDetails = await fetchTokenDetails(wallet, tokenUids);

    const sendNanoContractTxPrompt: SendNanoContractTxConfirmationPrompt = {
      ...rpcRequest,
      type: TriggerTypes.SendNanoContractTxConfirmationPrompt,
      data: {
        blueprintId,
        ncId: params.ncId,
        actions: params.actions,
        method: params.method,
        args: params.args,
        parsedArgs,
        pushTx: params.pushTx,
        tokenDetails,
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

      let response: Transaction | string;

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
    // Convert BigInt conversion errors to consistent InvalidParamsError for better API error handling
    if (err instanceof SyntaxError && err.message.includes('Cannot convert')) {
      throw new InvalidParamsError(`Invalid number format: ${err.message}`);
    }
    throw err;
  }
}
