/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from '@hathor/wallet-lib';
import { ConfirmationPromptTypes, GetAddressRpcRequest, PromptHandler } from '../types';
import { PromptRejectedError } from '../errors';

/**
 * Handles the 'get_address' RPC request by prompting the user for confirmation
 * and returning the address if confirmed.
 * 
 * @param rpcRequest - The RPC request object containing the method and parameters.
 * @param wallet - The Hathor wallet instance used to get the address.
 * @param promptHandler - The function to handle prompting the user for confirmation.
 *
 * @returns The address from the wallet if the user confirms.
 *
 * @throws {PromptRejectedError} If the user rejects the prompt.
 */
export async function getAddress(
  rpcRequest: GetAddressRpcRequest,
  wallet: HathorWallet,
  promptHandler: PromptHandler,
) {
  const { type } = rpcRequest.params;
  let address: string;

  if (type === 'first_empty') {
    address = await wallet.getCurrentAddress();
  } else {
    throw new Error('Not implemented.');
  }

  const confirmed = await promptHandler({
    type: ConfirmationPromptTypes.AddressRequestPrompt,
    method: rpcRequest.method,
    data: {
      address,
    }
  });

  if (!confirmed) {
    throw new PromptRejectedError();
  }

  return address;
}
