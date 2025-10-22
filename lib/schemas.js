"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.txIdSchema = exports.IUtxoSchema = exports.ITokenMetadataSchema = exports.ITokenBalanceSchema = exports.ILockedUtxoSchema = exports.IHistoryTxSchema = exports.IHistoryOutputSchema = exports.IHistoryOutputDecodedSchema = exports.IHistoryNanoContractContextSchema = exports.IHistoryNanoContractBaseTokenAction = exports.IHistoryNanoContractBaseAuthorityAction = exports.IHistoryNanoContractBaseAction = exports.IHistoryNanoContractActionWithdrawalSchema = exports.IHistoryNanoContractActionSchema = exports.IHistoryNanoContractActionGrantAuthoritySchema = exports.IHistoryNanoContractActionDepositSchema = exports.IHistoryNanoContractActionAcquireAuthoritySchema = exports.IHistoryInputSchema = exports.IBalanceSchema = exports.IAuthoritiesBalanceSchema = exports.IAddressMetadataAsRecordSchema = void 0;
var _zod = require("zod");
var _types = require("./types");
var _bigint = require("./utils/bigint");
/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * TxId schema
 */
const txIdSchema = exports.txIdSchema = _zod.z.string().regex(/^[a-fA-F0-9]{64}$/);
const ITokenBalanceSchema = exports.ITokenBalanceSchema = _zod.z.object({
  locked: _bigint.bigIntCoercibleSchema,
  unlocked: _bigint.bigIntCoercibleSchema
}).passthrough();
const IAuthoritiesBalanceSchema = exports.IAuthoritiesBalanceSchema = _zod.z.object({
  mint: ITokenBalanceSchema,
  melt: ITokenBalanceSchema
}).passthrough();
const IBalanceSchema = exports.IBalanceSchema = _zod.z.object({
  tokens: ITokenBalanceSchema,
  authorities: IAuthoritiesBalanceSchema
}).passthrough();
const IAddressMetadataAsRecordSchema = exports.IAddressMetadataAsRecordSchema = _zod.z.object({
  numTransactions: _zod.z.number(),
  balance: _zod.z.record(IBalanceSchema),
  seqnum: _zod.z.number()
}).passthrough();
const ITokenMetadataSchema = exports.ITokenMetadataSchema = _zod.z.object({
  numTransactions: _zod.z.number(),
  balance: IBalanceSchema
}).passthrough();
const IHistoryOutputDecodedSchema = exports.IHistoryOutputDecodedSchema = _zod.z.object({
  type: _zod.z.string().optional(),
  address: _zod.z.string().optional(),
  timelock: _zod.z.number().nullish(),
  data: _zod.z.string().optional()
}).passthrough();
const IHistoryInputSchema = exports.IHistoryInputSchema = _zod.z.object({
  value: _bigint.bigIntCoercibleSchema,
  token_data: _zod.z.number(),
  script: _zod.z.string(),
  decoded: IHistoryOutputDecodedSchema,
  token: _zod.z.string(),
  tx_id: txIdSchema,
  index: _zod.z.number()
}).passthrough();
const IHistoryOutputSchema = exports.IHistoryOutputSchema = _zod.z.object({
  value: _bigint.bigIntCoercibleSchema,
  token_data: _zod.z.number(),
  script: _zod.z.string(),
  decoded: IHistoryOutputDecodedSchema,
  token: _zod.z.string(),
  spent_by: _zod.z.string().nullable(),
  selected_as_input: _zod.z.boolean().optional()
}).passthrough();
const IHistoryNanoContractBaseAction = exports.IHistoryNanoContractBaseAction = _zod.z.object({
  token_uid: _zod.z.string()
});
const IHistoryNanoContractBaseTokenAction = exports.IHistoryNanoContractBaseTokenAction = IHistoryNanoContractBaseAction.extend({
  amount: _bigint.bigIntCoercibleSchema
});
const IHistoryNanoContractBaseAuthorityAction = exports.IHistoryNanoContractBaseAuthorityAction = IHistoryNanoContractBaseAction.extend({
  mint: _zod.z.boolean(),
  melt: _zod.z.boolean()
});
const IHistoryNanoContractActionWithdrawalSchema = exports.IHistoryNanoContractActionWithdrawalSchema = IHistoryNanoContractBaseTokenAction.extend({
  type: _zod.z.literal('withdrawal')
}).passthrough();
const IHistoryNanoContractActionDepositSchema = exports.IHistoryNanoContractActionDepositSchema = IHistoryNanoContractBaseTokenAction.extend({
  type: _zod.z.literal('deposit')
}).passthrough();
const IHistoryNanoContractActionGrantAuthoritySchema = exports.IHistoryNanoContractActionGrantAuthoritySchema = IHistoryNanoContractBaseAuthorityAction.extend({
  type: _zod.z.literal('grant_authority')
}).passthrough();
const IHistoryNanoContractActionAcquireAuthoritySchema = exports.IHistoryNanoContractActionAcquireAuthoritySchema = IHistoryNanoContractBaseAuthorityAction.extend({
  type: _zod.z.literal('acquire_authority')
}).passthrough();
const IHistoryNanoContractActionSchema = exports.IHistoryNanoContractActionSchema = _zod.z.discriminatedUnion('type', [IHistoryNanoContractActionDepositSchema, IHistoryNanoContractActionWithdrawalSchema, IHistoryNanoContractActionGrantAuthoritySchema, IHistoryNanoContractActionAcquireAuthoritySchema]);
const IHistoryNanoContractContextSchema = exports.IHistoryNanoContractContextSchema = _zod.z.object({
  actions: IHistoryNanoContractActionSchema.array(),
  address: _zod.z.string(),
  timestamp: _zod.z.number()
}).passthrough();
const IHistoryTxSchema = exports.IHistoryTxSchema = _zod.z.object({
  tx_id: txIdSchema,
  signalBits: _zod.z.number().optional(),
  version: _zod.z.number(),
  weight: _zod.z.number(),
  timestamp: _zod.z.number(),
  is_voided: _zod.z.boolean(),
  nonce: _zod.z.number().optional(),
  inputs: IHistoryInputSchema.array(),
  outputs: IHistoryOutputSchema.array(),
  parents: _zod.z.string().array(),
  token_name: _zod.z.string().optional(),
  token_symbol: _zod.z.string().optional(),
  tokens: _zod.z.string().array().optional(),
  height: _zod.z.number().optional(),
  processingStatus: _zod.z.nativeEnum(_types.TxHistoryProcessingStatus).optional(),
  nc_id: _zod.z.string().optional(),
  nc_blueprint_id: _zod.z.string().optional(),
  nc_method: _zod.z.string().optional(),
  nc_args: _zod.z.string().optional(),
  nc_pubkey: _zod.z.string().regex(/^[a-fA-F0-9]*$/).optional(),
  // for on-chain-blueprints
  nc_address: _zod.z.string().optional(),
  nc_context: IHistoryNanoContractContextSchema.optional(),
  first_block: _zod.z.string().nullish()
}).passthrough();
const IUtxoSchema = exports.IUtxoSchema = _zod.z.object({
  txId: txIdSchema,
  index: _zod.z.number(),
  token: _zod.z.string(),
  address: _zod.z.string(),
  value: _bigint.bigIntCoercibleSchema,
  authorities: _bigint.bigIntCoercibleSchema,
  timelock: _zod.z.number().nullable(),
  type: _zod.z.number(),
  height: _zod.z.number().nullable()
}).passthrough();
const ILockedUtxoSchema = exports.ILockedUtxoSchema = _zod.z.object({
  tx: IHistoryTxSchema,
  index: _zod.z.number()
}).passthrough();