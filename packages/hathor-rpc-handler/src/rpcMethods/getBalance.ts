/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';
import { constants } from '@hathor/wallet-lib';
import type { IHathorWallet } from '@hathor/wallet-lib';
import type { GetBalanceObject } from '@hathor/wallet-lib/lib/wallet/types';
import {
  GetBalanceRpcRequest,
  TriggerHandler,
  RequestMetadata,
  RpcResponseTypes,
  RpcResponse,
} from '../types';
import { NotImplementedError, InvalidParamsError } from '../errors';
import { validateNetwork } from '../helpers';

const getBalanceSchema = z.object({
  network: z.string().min(1),
  // Optional: omitting it returns the native token (HTR) plus all registered
  // tokens (not an empty result); a provided list selects just that subset.
  tokens: z.array(z.string().min(1)).min(1).optional(),
  addressIndexes: z.array(z.number().int().nonnegative()).optional(),
});

/**
 * Gets the balance for the requested tokens (or the native token plus all
 * registered tokens when `tokens` is omitted) using the provided wallet.
 *
 * Balance is non-sensitive, read-only data shared with already-connected dApps,
 * so this handler does NOT prompt the user for confirmation (mirroring
 * `getConnectedNetwork` / `getWalletInformation`).
 *
 * @param rpcRequest - The RPC request containing the parameters.
 * @param wallet - The wallet instance.
 * @param _requestMetadata - Metadata about the dApp (unused).
 * @param _promptHandler - Prompt callback (unused — balance is prompt-free).
 *
 * @returns The balances of the requested/registered tokens.
 *
 * @throws {NotImplementedError} - If address indexes are specified.
 * @throws {InvalidParamsError} - If the request parameters are invalid.
 */
export async function getBalance(
  rpcRequest: GetBalanceRpcRequest,
  wallet: IHathorWallet,
  _requestMetadata: RequestMetadata,
  _promptHandler: TriggerHandler,
) {
  const parseResult = getBalanceSchema.safeParse(rpcRequest.params);

  if (!parseResult.success) {
    throw new InvalidParamsError(parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
  }

  const params = parseResult.data;

  if (params.addressIndexes) {
    throw new NotImplementedError();
  }

  validateNetwork(wallet, params.network);

  let tokenUids = params.tokens;
  if (!tokenUids) {
    // getRegisteredTokens() yields only custom tokens, never native HTR — seed the
    // list with HTR so the "all tokens" response includes it.
    tokenUids = [constants.NATIVE_TOKEN_UID];
    for await (const token of wallet.storage.getRegisteredTokens()) {
      if (token.uid !== constants.NATIVE_TOKEN_UID) {
        tokenUids.push(token.uid);
      }
    }
  }

  const balances: GetBalanceObject[] = (await Promise.all(
    tokenUids.map(token => wallet.getBalance(token)),
  )).flat();

  return {
    type: RpcResponseTypes.GetBalanceResponse,
    response: balances,
  } as RpcResponse;
}
