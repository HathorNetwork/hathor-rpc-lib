"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transactionApiSchema = exports.fullnodeTxApiTxSchema = exports.fullnodeTxApiTokenSchema = exports.fullnodeTxApiOutputSchema = exports.fullnodeTxApiMetaSchema = exports.fullnodeTxApiInputSchema = exports.decodedSchema = void 0;
var _zod = require("zod");
var _bigint = require("../../utils/bigint");
var _schemas = require("../../schemas");
/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const p2pkhDecodedScriptSchema = _zod.z.object({
  type: _zod.z.literal('P2PKH'),
  address: _zod.z.string(),
  timelock: _zod.z.number().nullish(),
  value: _bigint.bigIntCoercibleSchema,
  token_data: _zod.z.number()
});
const p2shDecodedScriptSchema = _zod.z.object({
  type: _zod.z.literal('MultiSig'),
  address: _zod.z.string(),
  timelock: _zod.z.number().nullish(),
  value: _bigint.bigIntCoercibleSchema,
  token_data: _zod.z.number()
});
const unknownDecodedScriptSchema = _zod.z.object({
  type: _zod.z.undefined()
}).passthrough();

// TODO: This should be unified with IHistoryOutputDecodedSchema
const decodedSchema = exports.decodedSchema = _zod.z.discriminatedUnion('type', [p2pkhDecodedScriptSchema, p2shDecodedScriptSchema, unknownDecodedScriptSchema]);
const fullnodeTxApiInputSchema = exports.fullnodeTxApiInputSchema = _zod.z.object({
  value: _bigint.bigIntCoercibleSchema,
  token_data: _zod.z.number(),
  script: _zod.z.string(),
  decoded: decodedSchema,
  tx_id: _zod.z.string(),
  index: _zod.z.number(),
  token: _zod.z.string().nullish()
});
const fullnodeTxApiOutputSchema = exports.fullnodeTxApiOutputSchema = _zod.z.object({
  value: _bigint.bigIntCoercibleSchema,
  token_data: _zod.z.number(),
  script: _zod.z.string(),
  decoded: decodedSchema,
  token: _zod.z.string().nullish(),
  spent_by: _zod.z.string().nullable().default(null)
});
const fullnodeTxApiTokenSchema = exports.fullnodeTxApiTokenSchema = _zod.z.object({
  uid: _zod.z.string(),
  name: _zod.z.string().nullable(),
  symbol: _zod.z.string().nullable()
});
const fullnodeTxApiTxSchema = exports.fullnodeTxApiTxSchema = _zod.z.object({
  hash: _zod.z.string(),
  nonce: _zod.z.string(),
  timestamp: _zod.z.number(),
  version: _zod.z.number(),
  weight: _zod.z.number(),
  signal_bits: _zod.z.number(),
  parents: _zod.z.string().array(),
  nc_id: _zod.z.string().nullish(),
  nc_method: _zod.z.string().nullish(),
  nc_pubkey: _zod.z.string().nullish(),
  nc_address: _zod.z.string().nullish(),
  nc_context: _schemas.IHistoryNanoContractContextSchema.nullish(),
  nc_args: _zod.z.string().nullish(),
  nc_blueprint_id: _zod.z.string().nullish(),
  inputs: fullnodeTxApiInputSchema.array(),
  outputs: fullnodeTxApiOutputSchema.array(),
  tokens: fullnodeTxApiTokenSchema.array(),
  token_name: _zod.z.string().nullish(),
  token_symbol: _zod.z.string().nullish(),
  raw: _zod.z.string()
});
const fullnodeTxApiMetaSchema = exports.fullnodeTxApiMetaSchema = _zod.z.object({
  hash: _zod.z.string(),
  spent_outputs: _zod.z.tuple([_zod.z.number(), _zod.z.string().array()]).array(),
  received_by: _zod.z.string().array(),
  children: _zod.z.string().array(),
  conflict_with: _zod.z.string().array(),
  voided_by: _zod.z.string().array(),
  twins: _zod.z.string().array(),
  accumulated_weight: _zod.z.number(),
  score: _zod.z.number(),
  height: _zod.z.number(),
  min_height: _zod.z.number(),
  feature_activation_bit_counts: _zod.z.number().array().nullable(),
  first_block: _zod.z.string().nullish(),
  validation: _zod.z.string().nullish(),
  first_block_height: _zod.z.number().nullish()
});
const transactionApiSchema = exports.transactionApiSchema = _zod.z.discriminatedUnion('success', [_zod.z.object({
  success: _zod.z.literal(true),
  tx: fullnodeTxApiTxSchema.passthrough(),
  meta: fullnodeTxApiMetaSchema.passthrough(),
  spent_outputs: _zod.z.record(_zod.z.coerce.number(), _zod.z.string())
}), _zod.z.object({
  success: _zod.z.literal(false),
  message: _zod.z.string().nullish()
})]);