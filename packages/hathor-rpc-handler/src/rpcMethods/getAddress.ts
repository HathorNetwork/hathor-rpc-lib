/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from '@hathor/wallet-lib';
import { PromptHandler, RpcRequest } from '../types';
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
 * @throws {Error} If the RPC request method is not 'get_address'.
 * @throws {PromptRejectedError} If the user rejects the prompt.
 */
export async function getAddress(
  rpcRequest: RpcRequest,
  wallet: HathorWallet,
  promptHandler: PromptHandler,
) {
  if (rpcRequest.method !== 'get_address') {
    throw new Error('getAddress trying to handle method different from get_address');
  }

  const address = wallet.getAddressAtIndex(0);

  const confirmed = await promptHandler({
    method: 'get_address',
    data: {
      address,
    }
  });

  if (!confirmed) {
    throw new PromptRejectedError();
  }

  return address;
}
