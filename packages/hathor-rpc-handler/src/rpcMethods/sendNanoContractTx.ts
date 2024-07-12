/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from '@hathor/wallet-lib';
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
} from '../types';
import { PromptRejectedError, SendNanoContractTxFailure } from '../errors';

/**
 * Sends a nano contract transaction.
 *
 * This function prompts the user for a PIN code and address, then uses these 
 * to create and send a nano contract transaction based on the provided parameters.
 *
 * @param rpcRequest - The RPC request containing transaction details.
 * @param wallet - The wallet instance to create/send the transaction.
 * @param triggerHandler - The handler to manage user prompts.
 *
 * @returns The response from the transaction.
 *
 * @throws {SendNanoContractTxFailure} - If the transaction fails.
 */
export async function sendNanoContractTx(
  rpcRequest: SendNanoContractRpcRequest,
  wallet: HathorWallet,
  requestMetadata: RequestMetadata,
  triggerHandler: TriggerHandler,
) {
  const {
    method,
    blueprint_id,
    nc_id,
    actions,
    args,
    push_tx,
  } = rpcRequest.params

  const blueprintId = method === 'initialize' ? blueprint_id : nc_id;

  if (!blueprintId) {
    throw new Error('Neither blueprint id or ncId available');
  }

  const pinPrompt: PinConfirmationPrompt = {
    type: TriggerTypes.PinConfirmationPrompt,
    method: rpcRequest.method,
  };

  const sendNanoContractTxPrompt: SendNanoContractTxConfirmationPrompt = {
    type: TriggerTypes.SendNanoContractTxConfirmationPrompt,
    method: rpcRequest.method,
    data: {
      blueprintId,
      ncId: nc_id,
      actions,
      args,
      pushTx: push_tx,
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

  const sendMethod = push_tx ? wallet.createAndSendNanoContractTransaction.bind(wallet)
    : wallet.createNanoContractTransaction.bind(wallet);

  try {
    const sendNanoContractLoadingTrigger: SendNanoContractTxLoadingTrigger = {
      type: TriggerTypes.SendNanoContractTxLoadingTrigger,
    };
    // No need to await as this is a fire-and-forget trigger
    triggerHandler(sendNanoContractLoadingTrigger, requestMetadata);

    const response = await sendMethod(
      method,
      caller, {
        ncId: nc_id,
        blueprintId: confirmedBluePrintId,
        actions: confirmedActions,
        args: confirmedArgs,
      }, {
        pinCode: pinCodeResponse.data.pinCode,
      }
    );

    return {
      type: RpcResponseTypes.SendNanoContractTxResponse,
      response,
    } as RpcResponse;
  } catch (err) {
    throw new SendNanoContractTxFailure();
  }
}
