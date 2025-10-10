/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { IHathorWallet } from '@hathor/wallet-lib';
import type { TokenDetailsObject } from '@hathor/wallet-lib/lib/wallet/types';
import { constants } from '@hathor/wallet-lib';
import { DifferentNetworkError } from '../errors';

export function validateNetwork(wallet: IHathorWallet, network: string) {
  const currentNetwork = wallet.getNetwork();

  if (currentNetwork !== network) {
    throw new DifferentNetworkError();
  }
}

/**
 * Fetches token details for a list of token UIDs, excluding the native token.
 *
 * @param wallet - The Hathor wallet instance used to get token details.
 * @param tokens - Array of token UIDs to fetch details for.
 * @returns A map of token UID to token details.
 */
export async function fetchTokenDetails(
  wallet: IHathorWallet,
  tokens: string[]
): Promise<Map<string, TokenDetailsObject>> {
  const tokenDetailsMap = new Map<string, TokenDetailsObject>();

  // Filter out NATIVE_TOKEN_UID and get unique tokens
  const uniqueTokens = Array.from(new Set(
    tokens.filter(token => token !== constants.NATIVE_TOKEN_UID)
  ));

  // Fetch token details for each unique token
  await Promise.all(
    uniqueTokens.map(async (tokenUid) => {
      const tokenData = await wallet.getTokenDetails(tokenUid);
      tokenDetailsMap.set(tokenUid, tokenData);
    })
  );

  return tokenDetailsMap;
}
