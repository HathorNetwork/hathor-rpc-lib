/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TokenInfoVersion } from '@hathor/wallet-lib/lib/models/enum';
import { z } from 'zod';

export const createTokenBaseSchema = z.object({
  name: z.string().min(1).max(30),
  symbol: z.string().min(2).max(5),
  amount: z.union([z.string(), z.bigint()]),
  version: z.nativeEnum(TokenInfoVersion).optional(),
  changeAddress: z.string().nullable().optional(),
  createMint: z.boolean().optional(),
  mintAuthorityAddress: z.string().nullable().optional(),
  allowExternalMintAuthorityAddress: z.boolean().optional(),
  createMelt: z.boolean().optional(),
  meltAuthorityAddress: z.string().nullable().optional(),
  allowExternalMeltAuthorityAddress: z.boolean().optional(),
  data: z.array(z.string()).nullable().optional(),
  mintAddress: z.string().nullable().optional(),
});

// Schema for the original createToken RPC method with snake_case fields
export const createTokenRpcSchema = z.object({
  name: z.string().min(1).max(30),
  symbol: z.string().min(2).max(5),
  amount: z.string().regex(/^\d+$/)
    .pipe(z.coerce.bigint().positive()),
  version: z.nativeEnum(TokenInfoVersion).nullish().default(null),
  address: z.string().nullish().default(null),
  change_address: z.string().nullish().default(null),
  create_mint: z.boolean().default(true),
  mint_authority_address: z.string().nullish().default(null),
  allow_external_mint_authority_address: z.boolean().default(false),
  create_melt: z.boolean().default(true),
  melt_authority_address: z.string().nullish().default(null),
  allow_external_melt_authority_address: z.boolean().default(false),
  data: z.string().array().nullish().default(null),
}).transform(data => ({
  name: data.name,
  symbol: data.symbol,
  amount: data.amount,
  options: {
    changeAddress: data.change_address,
    createMint: data.create_mint,
    mintAuthorityAddress: data.mint_authority_address,
    allowExternalMintAuthorityAddress: data.allow_external_mint_authority_address,
    createMelt: data.create_melt,
    meltAuthorityAddress: data.melt_authority_address,
    allowExternalMeltAuthorityAddress: data.allow_external_melt_authority_address,
    data: data.data,
    mintAddress: data.address,
    tokenInfoVersion: data.version,
  }
})); 