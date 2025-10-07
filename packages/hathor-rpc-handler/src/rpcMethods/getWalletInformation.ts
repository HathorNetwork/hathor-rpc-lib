/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';
import type { IHathorWallet } from '@hathor/wallet-lib';
import {
  GetWalletInformationRpcRequest,
  RequestMetadata,
  RpcResponse,
  RpcResponseTypes,
  TriggerHandler,
  RpcMethods,
} from '../types';
import { InvalidParamsError } from '../errors';

const getWalletInformationSchema = z.object({
  method: z.literal(RpcMethods.GetWalletInformation),
});

/**
 * Handles the 'get_wallet_information' RPC request by retrieving the network information
 * and the address at index 0 from the wallet.
 *
 * @param rpcRequest - The RPC request object containing the method.
 * @param wallet - The Hathor wallet instance used to get the wallet information.
 * @param _requestMetadata - (unused) Metadata related to the dApp that sent the RPC
 * @param _promptHandler - (unused) The function to handle prompts for user confirmation.
 *
 * @returns An object containing the network name and address at index 0.
 *
 * @throws {InvalidParamsError} - If the request parameters are invalid.
 */
export async function getWalletInformation(
  rpcRequest: GetWalletInformationRpcRequest,
  wallet: IHathorWallet,
  _requestMetadata: RequestMetadata,
  _promptHandler: TriggerHandler,
) {
  const parseResult = getWalletInformationSchema.safeParse(rpcRequest);

  if (!parseResult.success) {
    throw new InvalidParamsError(parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
  }

  const network: string = wallet.getNetwork();
  const address0 = await wallet.getAddressAtIndex(0);

  const result = {
    network,
    address0,
  };

  return {
    type: RpcResponseTypes.GetWalletInformationResponse,
    response: result,
  } as RpcResponse;
}
