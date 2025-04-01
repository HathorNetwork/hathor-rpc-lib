/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RpcMethods, CreateTokenRpcRequest } from '../types';

export function createTokenRpcRequest(
  pushTx: boolean,
  network: string,
  name: string,
  symbol: string,
  amount: string,
  address?: string,
  createMint: boolean = true,
  createMelt: boolean = true,
  allowExternalMintAuthorityAddress: boolean = false,
  allowExternalMeltAuthorityAddress: boolean = false,
  changeAddress?: string,
  mintAuthorityAddress?: string,
  meltAuthorityAddress?: string,
  data?: string[],
): CreateTokenRpcRequest {
  return {
    method: RpcMethods.CreateToken,
    params: {
      push_tx: pushTx,
      network,
      name,
      symbol,
      amount,
      create_mint: createMint,
      create_melt: createMelt,
      allow_external_mint_authority_address: allowExternalMintAuthorityAddress,
      allow_external_melt_authority_address: allowExternalMeltAuthorityAddress,
      address,
      change_address: changeAddress,
      mint_authority_address: mintAuthorityAddress,
      data,
      melt_authority_address: meltAuthorityAddress
    }
  };
}
