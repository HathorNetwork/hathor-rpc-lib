/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';
import type { HathorWallet } from '@hathor/wallet-lib';
import { 
  GetConnectedNetworkRpcRequest,
  RequestMetadata,
  RpcResponse,
  RpcResponseTypes,
  TriggerHandler,
  RpcMethods,
} from '../types';
import { InvalidParamsError } from '../errors';

const getConnectedNetworkSchema = z.object({
  method: z.literal(RpcMethods.GetConnectedNetwork),
});

/**
 * Handles the 'get_connected_network' RPC request by retrieving the network information
 * from the wallet and returning the network name and genesis hash.
 * 
 * @param rpcRequest - The RPC request object containing the method.
 * @param wallet - The Hathor wallet instance used to get the network information.
 * @param _requestMetadata - (unused) Metadata related to the dApp that sent the RPC
 * @param _promptHandler - (unused) The function to handle prompts for user confirmation.
 *
 * @returns An object containing the network name and genesis hash.
 * 
 * @throws {InvalidParamsError} - If the request parameters are invalid.
 */
export async function getConnectedNetwork(
  rpcRequest: GetConnectedNetworkRpcRequest,
  wallet: HathorWallet,
  _requestMetadata: RequestMetadata,
  _promptHandler: TriggerHandler,
) {
  try {
    getConnectedNetworkSchema.parse(rpcRequest);

    const network: string = wallet.getNetwork();

    const result = {
      network,
      genesisHash: '', // TODO
    };

    return {
      type: RpcResponseTypes.GetConnectedNetworkResponse,
      response: result,
    } as RpcResponse;
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new InvalidParamsError(err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    throw err;
  }
}
