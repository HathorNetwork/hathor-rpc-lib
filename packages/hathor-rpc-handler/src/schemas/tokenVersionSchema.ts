/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TokenVersion } from '@hathor/wallet-lib';
import { z } from 'zod';

/**
 * String representation of token versions for RPC API.
 * Maps to internal TokenVersion enum values.
 */
export enum TokenVersionString {
  DEPOSIT = 'deposit',
  FEE = 'fee',
}

/**
 * Maps TokenVersionString to internal TokenVersion enum.
 */
const tokenVersionMap: Record<TokenVersionString, TokenVersion> = {
  [TokenVersionString.DEPOSIT]: TokenVersion.DEPOSIT,
  [TokenVersionString.FEE]: TokenVersion.FEE,
};

/**
 * Zod schema that accepts TokenVersionString and transforms to TokenVersion.
 * Defaults to DEPOSIT when not provided.
 */
export const tokenVersionStringSchema = z
  .nativeEnum(TokenVersionString)
  .nullish()
  .default(TokenVersionString.DEPOSIT)
  .transform(val => tokenVersionMap[val as TokenVersionString]);
