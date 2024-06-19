/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from '@hathor/wallet-lib';
import { AddressRequestClientResponse, ConfirmationPromptTypes, GetAddressRpcRequest, PromptHandler } from '../types';
import { NotImplementedError, PromptRejectedError } from '../errors';
import { validateNetwork } from '../helpers';

/**
 * Gets an address based on the provided rpcRequest and wallet.
 *
 * @param rpcRequest - The RPC request containing the parameters for getting an address.
 * @param wallet - The wallet instance to use for retrieving the address.
 * @param promptHandler - A function to handle prompts for user confirmation.
 *
 * @returns The address retrieved based on the request parameters.
 *
 * @throws {NotImplementedError} - If the request type is 'full_path', which is not implemented.
 * @throws {PromptRejectedError} - If the user rejects the address confirmation prompt.
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
      const response = (await promptHandler({
        type: ConfirmationPromptTypes.AddressRequestClientPrompt,
        method: rpcRequest.method,
      })) as AddressRequestClientResponse;

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
