/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from '@hathor/wallet-lib';
import { AddressRequestPrompt, ConfirmationPromptTypes, PinConfirmationPrompt, PromptHandler, SendNanoContractRpcRequest } from '../types';
import { SendNanoContractTxFailure } from '../errors';

/**
 * Sends a nano contract transaction.
 *
 * This function prompts the user for a PIN code and address, then uses these 
 * to create and send a nano contract transaction based on the provided parameters.
 *
 * @param rpcRequest - The RPC request containing transaction details.
 * @param wallet - The wallet instance to create/send the transaction.
 * @param promptHandler - The handler to manage user prompts.
 *
 * @returns The response from the transaction.
 *
 * @throws {SendNanoContractTxFailure} - If the transaction fails.
 */
export async function sendNanoContractTx(
  rpcRequest: SendNanoContractRpcRequest,
  wallet: HathorWallet,
  promptHandler: PromptHandler,
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

  const pinPrompt: PinConfirmationPrompt = {
    type: ConfirmationPromptTypes.PinConfirmationPrompt,
    method: rpcRequest.method,
  };
  const pinCode = await promptHandler(pinPrompt);

  const addressPrompt: AddressRequestPrompt = {
    type: ConfirmationPromptTypes.AddressRequestPrompt,
    method: rpcRequest.method,
  };

  const address = await promptHandler(addressPrompt);

  const sendMethod = push_tx ? wallet.createAndSendNanoContractTransaction
    : wallet.createNanoContractTransaction;

  try {
    const response = await sendMethod(
      method,
      address, {
        blueprint_id: blueprintId,
        actions,
        args,
      }, {
        pinCode,
      }
    );

    return response;
  } catch (err) {
    // TODO: Better error handling, we should use the errors from the lib.
    throw new SendNanoContractTxFailure();
  }
}
