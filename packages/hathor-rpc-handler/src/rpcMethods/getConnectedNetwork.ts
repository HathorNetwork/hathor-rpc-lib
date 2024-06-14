/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Network } from '@hathor/wallet-lib';
import { HathorWallet } from '@hathor/wallet-lib';
import { GetConnectedNetworkRpcRequest } from '../types';

/**
 * Handles the 'get_connected_network' RPC request by retrieving the network information
 * from the wallet and returning the network name and genesis hash.
 * 
 * @param rpcRequest - The RPC request object containing the method and parameters.
 * @param wallet - The Hathor wallet instance used to get the network information.
 *
 * @returns An object containing the network name and genesis hash.
 */
export async function getConnectedNetwork(
  _rpcRequest: GetConnectedNetworkRpcRequest,
  wallet: HathorWallet,
) {

  const network: Network = await wallet.getNetworkObject();

  const result = {
    network: network.name,
    genesisHash: '', // TODO
  }

  return result;
}
