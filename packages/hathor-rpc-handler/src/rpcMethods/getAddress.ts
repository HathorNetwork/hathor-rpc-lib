/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from '@hathor/wallet-lib';
import { ConfirmationPromptTypes, GetAddressRpcRequest, PromptHandler } from '../types';
import { NotImplementedError, PromptRejectedError } from '../errors';
import { validateNetwork } from '../helpers';

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
  validateNetwork(wallet, rpcRequest.params.network);

  const { type, index } = rpcRequest.params;
  let address: string;

  switch (type) {
    case 'first_empty':
      address = await wallet.getCurrentAddress();
    break;
    case 'full_path':
      throw new NotImplementedError();
    case 'index':
      address = await wallet.getAddressAtIndex(index);
    break;
    case 'client': {
      const response = await promptHandler({
        type: ConfirmationPromptTypes.AddressRequestClientPrompt,
        method: rpcRequest.method,
      });

      address = response.data.address;
    }
    break;
  }

  // We already confirmed with the user and he selected the address he wanted
  // to share. No need to double check
  if (type !== 'client') {
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
  }

  return address;
}
