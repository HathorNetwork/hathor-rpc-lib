"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NanoContractVertexType = exports.NanoContractHeaderActionType = exports.NanoContractActionType = exports.INanoContractActionWithdrawalSchema = exports.INanoContractActionTokenBase = exports.INanoContractActionSchema = exports.INanoContractActionGrantAuthoritySchema = exports.INanoContractActionDepositSchema = exports.INanoContractActionBase = exports.INanoContractActionAuthorityBase = exports.INanoContractActionAcquireAuthoritySchema = exports.ActionTypeToActionHeaderType = void 0;
var _zod = require("zod");
var _bigint = require("../utils/bigint");
/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
let NanoContractVertexType = exports.NanoContractVertexType = /*#__PURE__*/function (NanoContractVertexType) {
  NanoContractVertexType["TRANSACTION"] = "transaction";
  NanoContractVertexType["CREATE_TOKEN_TRANSACTION"] = "createTokenTransaction";
  return NanoContractVertexType;
}({});
let NanoContractActionType = exports.NanoContractActionType = /*#__PURE__*/function (NanoContractActionType) {
  NanoContractActionType["DEPOSIT"] = "deposit";
  NanoContractActionType["WITHDRAWAL"] = "withdrawal";
  NanoContractActionType["GRANT_AUTHORITY"] = "grant_authority";
  NanoContractActionType["ACQUIRE_AUTHORITY"] = "acquire_authority";
  return NanoContractActionType;
}({});
let NanoContractHeaderActionType = exports.NanoContractHeaderActionType = /*#__PURE__*/function (NanoContractHeaderActionType) {
  NanoContractHeaderActionType[NanoContractHeaderActionType["DEPOSIT"] = 1] = "DEPOSIT";
  NanoContractHeaderActionType[NanoContractHeaderActionType["WITHDRAWAL"] = 2] = "WITHDRAWAL";
  NanoContractHeaderActionType[NanoContractHeaderActionType["GRANT_AUTHORITY"] = 3] = "GRANT_AUTHORITY";
  NanoContractHeaderActionType[NanoContractHeaderActionType["ACQUIRE_AUTHORITY"] = 4] = "ACQUIRE_AUTHORITY";
  return NanoContractHeaderActionType;
}({});
const ActionTypeToActionHeaderType = exports.ActionTypeToActionHeaderType = {
  [NanoContractActionType.DEPOSIT]: NanoContractHeaderActionType.DEPOSIT,
  [NanoContractActionType.WITHDRAWAL]: NanoContractHeaderActionType.WITHDRAWAL,
  [NanoContractActionType.GRANT_AUTHORITY]: NanoContractHeaderActionType.GRANT_AUTHORITY,
  [NanoContractActionType.ACQUIRE_AUTHORITY]: NanoContractHeaderActionType.ACQUIRE_AUTHORITY
};

// The action in the header is serialized/deserialized in the class
// and it's used only to help calculate the token balance
// That's why it's simple and with less fields

const INanoContractActionBase = exports.INanoContractActionBase = _zod.z.object({
  token: _zod.z.string()
});
const INanoContractActionTokenBase = exports.INanoContractActionTokenBase = INanoContractActionBase.extend({
  amount: _bigint.bigIntCoercibleSchema
});
const INanoContractActionAuthorityBase = exports.INanoContractActionAuthorityBase = INanoContractActionBase.extend({
  authority: _zod.z.string()
});
const INanoContractActionWithdrawalSchema = exports.INanoContractActionWithdrawalSchema = INanoContractActionTokenBase.extend({
  type: _zod.z.literal('withdrawal'),
  address: _zod.z.string()
}).passthrough();
const INanoContractActionDepositSchema = exports.INanoContractActionDepositSchema = INanoContractActionTokenBase.extend({
  type: _zod.z.literal('deposit'),
  address: _zod.z.string().optional(),
  changeAddress: _zod.z.string().optional()
}).passthrough();
const INanoContractActionGrantAuthoritySchema = exports.INanoContractActionGrantAuthoritySchema = INanoContractActionAuthorityBase.extend({
  type: _zod.z.literal('grant_authority'),
  address: _zod.z.string().optional(),
  authorityAddress: _zod.z.string().optional()
}).passthrough();
const INanoContractActionAcquireAuthoritySchema = exports.INanoContractActionAcquireAuthoritySchema = INanoContractActionAuthorityBase.extend({
  type: _zod.z.literal('acquire_authority'),
  address: _zod.z.string()
}).passthrough();
const INanoContractActionSchema = exports.INanoContractActionSchema = _zod.z.discriminatedUnion('type', [INanoContractActionWithdrawalSchema, INanoContractActionDepositSchema, INanoContractActionGrantAuthoritySchema, INanoContractActionAcquireAuthoritySchema]);

/**
 * Buffer Read Only (RO) Extract value.
 * For methods that read a value from a buffer without altering the input buffer (read-only).
 * The method should return the value (T) extracted and the number of bytes read.
 * This way the caller has full control of the buffer since the method does not alter the inputs.
 */

/**
 * Data for creating a nano contract transaction
 */