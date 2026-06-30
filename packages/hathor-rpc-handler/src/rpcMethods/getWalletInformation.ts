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
import { resolveBalances } from '../helpers';

const getWalletInformationSchema = z.object({
  method: z.literal(RpcMethods.GetWalletInformation),
  params: z.object({
    // Optional: omit to return the balance of every token the wallet holds. When
    // provided, the list must contain at least one token UID (selecting that subset).
    tokens: z.array(z.string().min(1)).min(1).optional(),
  }).optional(),
});

/**
 * Handles the 'get_wallet_information' RPC request by retrieving the network,
 * the address at index 0 and the wallet balance from the wallet.
 *
 * The balance covers every token the wallet holds, or just the requested subset
 * when a non-empty `params.tokens` is provided. Like the network and address, balance is
 * non-sensitive, read-only data shared with already-connected dApps, so this
 * handler does NOT prompt the user for confirmation.
 *
 * @param rpcRequest - The RPC request object containing the method and optional params.
 * @param wallet - The Hathor wallet instance used to get the wallet information.
 * @param _requestMetadata - (unused) Metadata related to the dApp that sent the RPC
 * @param _promptHandler - (unused — wallet information is prompt-free).
 *
 * @returns An object containing the network name, the address at index 0 and the balance.
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
  const balance = await resolveBalances(wallet, parseResult.data.params?.tokens);

  const result = {
    network,
    address0,
    balance,
  };

  return {
    type: RpcResponseTypes.GetWalletInformationResponse,
    response: result,
  } as RpcResponse;
}
