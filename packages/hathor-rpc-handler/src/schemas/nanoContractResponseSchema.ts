/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';
import { INanoContractActionSchema } from '@hathor/wallet-lib';
import { bigIntCoercibleSchema } from '@hathor/wallet-lib/lib/utils/bigint';
import { createTokenBaseSchema } from './createTokenSchema';
import { TriggerResponseTypes } from '../types';

// Shared schema for rejected confirmation responses
const rejectedDataSchema = z.object({ accepted: z.literal(false) });

/** Validates nano contract params with required non-empty caller and all NC parameters. */
export const nanoContractResponseWithCallerSchema = z.object({
  caller: z.string().min(1, 'Missing or empty nano caller in confirmation response'),
  method: z.string().min(1, 'Missing or empty nano method in confirmation response'),
  blueprintId: z.string().nullable(),
  ncId: z.string().nullable(),
  actions: z.array(INanoContractActionSchema),
  args: z.array(z.unknown()),
  parsedArgs: z.array(z.unknown()),
  pushTx: z.boolean(),
  fee: bigIntCoercibleSchema,
  contractPaysFees: z.boolean().optional(),
}).passthrough();

/** Validates token params for nano contract create token responses. */
export const nanoContractCreateTokenParamsSchema = createTokenBaseSchema.extend({
  contractPaysTokenDeposit: z.boolean(),
}).passthrough();

export const sendNanoContractTxConfirmationDataSchema = z.object({
  accepted: z.literal(true),
  nc: nanoContractResponseWithCallerSchema,
});

export const sendNanoContractTxConfirmationResponseSchema = z.object({
  type: z.literal(TriggerResponseTypes.SendNanoContractTxConfirmationResponse),
  data: z.discriminatedUnion('accepted', [
    sendNanoContractTxConfirmationDataSchema,
    rejectedDataSchema,
  ]),
});

// --- CreateNanoContractCreateTokenTx ---

export const createNanoContractCreateTokenTxConfirmationDataSchema = z.object({
  accepted: z.literal(true),
  nano: nanoContractResponseWithCallerSchema,
  token: nanoContractCreateTokenParamsSchema,
});

export const createNanoContractCreateTokenTxConfirmationResponseSchema = z.object({
  type: z.literal(TriggerResponseTypes.CreateNanoContractCreateTokenTxConfirmationResponse),
  data: z.discriminatedUnion('accepted', [
    createNanoContractCreateTokenTxConfirmationDataSchema,
    rejectedDataSchema,
  ]),
});
