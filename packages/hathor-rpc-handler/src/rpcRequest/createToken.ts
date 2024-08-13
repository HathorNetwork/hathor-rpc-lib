/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  CreateTokenRpcRequest,
  RpcMethods,
} from '../types';

export function createTokenRequest(
  name: string,
  symbol: string,
  amount: number,
  pushTx: boolean,
  network: string,
  address: string | null = null,
  changeAddress: string | null = null,
  createMint: boolean = true,
  mintAuthorityAddress: string | null = null,
  allowExternalMintAuthorityAddress: boolean = false,
  createMelt: boolean = true,
  meltAuthorityAddress: string | null = null,
  allowExternalMeltAuthorityAddress: boolean = false,
  data: string[] | null = null,
): CreateTokenRpcRequest {
  return {
    method: RpcMethods.CreateToken,
    params: {
      name,
      symbol,
      amount,
      push_tx: pushTx,
      network,
      address,
      change_address: changeAddress,
      create_mint: createMint,
      mint_authority_address: mintAuthorityAddress,
      allow_external_mint_authority_address: allowExternalMintAuthorityAddress,
      create_melt: createMelt,
      melt_authority_address: meltAuthorityAddress,
      allow_external_melt_authority_address: allowExternalMeltAuthorityAddress,
      data,
    }
  };
}
