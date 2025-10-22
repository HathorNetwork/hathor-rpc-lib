"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UtxoSelectInstruction = exports.TxTemplateInstruction = exports.TxIndexSchema = exports.TxIdSchema = exports.TransactionTemplate = exports.TokenSchema = exports.TokenOutputInstruction = exports.TemplateRef = exports.ShuffleInstruction = exports.Sha256HexSchema = exports.SetVarInstruction = exports.SetVarGetWalletBalanceOpts = exports.SetVarGetWalletAddressOpts = exports.SetVarGetOracleSignedDataOpts = exports.SetVarGetOracleScriptOpts = exports.SetVarCallArgs = exports.RawOutputInstruction = exports.RawInputInstruction = exports.NanoWithdrawalAction = exports.NanoMethodInstruction = exports.NanoGrantAuthorityAction = exports.NanoDepositAction = exports.NanoAction = exports.NanoAcquireAuthorityAction = exports.DataOutputInstruction = exports.CustomTokenSchema = exports.CountSchema = exports.ConfigInstruction = exports.CompleteTxInstruction = exports.AuthoritySelectInstruction = exports.AuthorityOutputInstruction = exports.AmountSchema = exports.AddressSchema = void 0;
exports.getVariable = getVariable;
var _zod = require("zod");
var _constants = require("../../constants");
/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const TEMPLATE_REFERENCE_NAME_RE = /[\w\d]+/;
const TEMPLATE_REFERENCE_RE = /\{([\w\d]+)\}/;
const TemplateRef = exports.TemplateRef = _zod.z.string().regex(TEMPLATE_REFERENCE_RE);

/**
 * If the key matches a template reference (i.e. `{name}`) it returns the variable of that name.
 * If not the ref should be the actual value.
 * This is validated by the `schema` argument which is a ZodType that parses either:
 *   - A `TemplateRef` or;
 *   - A ZodType that outputs `S`;
 *
 * The generic system allows with just the first argument a validation that the
 * schema will parse to the expected type and that `ref` is `string | S`.
 * This way changes on validation affect the executors and the value from vars
 * will be of the expected type.
 * The goal of this system is to avoid too much verbosity while keeping strong cohesive typing.
 *
 * @example
 * ```
 * const TokenSchema = TemplateRef.or(z.string().regex(/^[A-F0-9]{64}&1/));
 * const AmountSchema = TemplateRef.or(z.bigint());
 * const IndexSchema = TemplateRef.or(z.number().min(0));
 *
 * const token: string = getVariable<string>(ref1, {foo: 'bar'}, TokenSchema);
 * const amount: bigint = getVariable<bigint>(ref2, {foo: 10n}, AmountSchema);
 * const token: string = getVariable<number>(ref3, {foo: 27}, IndexSchema);
 * ```
 */
function getVariable(ref, vars, schema) {
  let val = ref; // type should be: string | S
  const parsed = TemplateRef.safeParse(ref);
  if (parsed.success) {
    const match = parsed.data.match(TEMPLATE_REFERENCE_RE);
    if (match !== null) {
      const key = match[1];
      if (!(key in vars)) {
        throw new Error(`Variable ${key} not found in available variables`);
      }
      // We assume that the variable in the context is of type S and we validate this.
      // The case where a `{...}` string is saved is not possible since we do not
      // allow this type of string as variable.
      val = vars[key];
    }
  }
  return schema.parse(val);
}

// Transaction IDs and Custom Tokens are sha256 hex encoded
const Sha256HexSchema = exports.Sha256HexSchema = _zod.z.string().regex(/^[a-fA-F0-9]{64}$/);
const TxIdSchema = exports.TxIdSchema = Sha256HexSchema;
const CustomTokenSchema = exports.CustomTokenSchema = Sha256HexSchema;
// If we want to represent all tokens we need to include the native token uid 00
const TokenSchema = exports.TokenSchema = _zod.z.string().regex(/^[a-fA-F0-9]{64}$|^00$/);
// Addresses are base58 with length 34, may be 35 depending on the choice of version byte
const AddressSchema = exports.AddressSchema = _zod.z.string().regex(/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{34,35}$/);

/**
 * This schema is necessary because `z.coerce.bigint().optional()` throws
 * with `undefined` input due to how coerce works (this happens even with safeParse)
 * so we need a custom bigint that can receive number or string as input and be optional.
 * */
const AmountSchema = exports.AmountSchema = _zod.z.union([_zod.z.bigint(), _zod.z.number(), _zod.z.string().regex(/^\d+$/)]).pipe(_zod.z.coerce.bigint()).refine(val => val > 0n, 'Amount must be positive non-zero');
const CountSchema = exports.CountSchema = _zod.z.union([_zod.z.number(), _zod.z.string().regex(/^\d+$/)]).pipe(_zod.z.coerce.number().gte(1).lte(0xff));
const TxIndexSchema = exports.TxIndexSchema = _zod.z.union([_zod.z.number(), _zod.z.string().regex(/^\d+$/)]).pipe(_zod.z.coerce.number().gte(0).lte(0xff));
const RawInputInstruction = exports.RawInputInstruction = _zod.z.object({
  type: _zod.z.literal('input/raw'),
  position: _zod.z.number().default(-1),
  index: TemplateRef.or(TxIndexSchema),
  txId: TemplateRef.or(TxIdSchema)
});
const UtxoSelectInstruction = exports.UtxoSelectInstruction = _zod.z.object({
  type: _zod.z.literal('input/utxo'),
  position: _zod.z.number().default(-1),
  fill: TemplateRef.or(AmountSchema),
  token: TemplateRef.or(TokenSchema.default(_constants.NATIVE_TOKEN_UID)),
  address: TemplateRef.or(AddressSchema.optional()),
  autoChange: _zod.z.boolean().default(true),
  changeAddress: TemplateRef.or(AddressSchema.optional())
});
const AuthoritySelectInstruction = exports.AuthoritySelectInstruction = _zod.z.object({
  type: _zod.z.literal('input/authority'),
  position: _zod.z.number().default(-1),
  authority: _zod.z.enum(['mint', 'melt']),
  token: TemplateRef.or(CustomTokenSchema),
  count: TemplateRef.or(CountSchema.default(1)),
  address: TemplateRef.or(AddressSchema.optional())
});
const RawOutputInstruction = exports.RawOutputInstruction = _zod.z.object({
  type: _zod.z.literal('output/raw'),
  position: _zod.z.number().default(-1),
  amount: TemplateRef.or(AmountSchema.optional()),
  script: TemplateRef.or(_zod.z.string().regex(/^([a-fA-F0-9]{2})+$/)),
  token: TemplateRef.or(TokenSchema.default(_constants.NATIVE_TOKEN_UID)),
  timelock: TemplateRef.or(_zod.z.number().gte(0).optional()),
  authority: _zod.z.enum(['mint', 'melt']).optional(),
  useCreatedToken: _zod.z.boolean().default(false)
});
const TokenOutputInstruction = exports.TokenOutputInstruction = _zod.z.object({
  type: _zod.z.literal('output/token'),
  position: _zod.z.number().default(-1),
  amount: TemplateRef.or(AmountSchema),
  token: TemplateRef.or(TokenSchema.default(_constants.NATIVE_TOKEN_UID)),
  address: TemplateRef.or(AddressSchema),
  timelock: TemplateRef.or(_zod.z.number().gte(0).optional()),
  checkAddress: _zod.z.boolean().optional(),
  useCreatedToken: _zod.z.boolean().default(false)
});
const AuthorityOutputInstruction = exports.AuthorityOutputInstruction = _zod.z.object({
  type: _zod.z.literal('output/authority'),
  position: _zod.z.number().default(-1),
  count: TemplateRef.or(CountSchema.default(1)),
  token: TemplateRef.or(CustomTokenSchema.optional()),
  authority: _zod.z.enum(['mint', 'melt']),
  address: TemplateRef.or(AddressSchema),
  timelock: TemplateRef.or(_zod.z.number().gte(0).optional()),
  checkAddress: _zod.z.boolean().optional(),
  useCreatedToken: _zod.z.boolean().default(false)
});
const DataOutputInstruction = exports.DataOutputInstruction = _zod.z.object({
  type: _zod.z.literal('output/data'),
  position: _zod.z.number().default(-1),
  data: TemplateRef.or(_zod.z.string()),
  token: TemplateRef.or(TokenSchema.default(_constants.NATIVE_TOKEN_UID)),
  useCreatedToken: _zod.z.boolean().default(false)
});
const ShuffleInstruction = exports.ShuffleInstruction = _zod.z.object({
  type: _zod.z.literal('action/shuffle'),
  target: _zod.z.enum(['inputs', 'outputs', 'all'])
});
const CompleteTxInstruction = exports.CompleteTxInstruction = _zod.z.object({
  type: _zod.z.literal('action/complete'),
  token: TemplateRef.or(TokenSchema.optional()),
  address: TemplateRef.or(_zod.z.string().optional()),
  changeAddress: TemplateRef.or(AddressSchema.optional()),
  timelock: TemplateRef.or(_zod.z.number().gte(0).optional()),
  skipSelection: _zod.z.boolean().default(false),
  // do NOT add inputs to the tx
  skipChange: _zod.z.boolean().default(false),
  // do NOT add outputs from outstanding tokens.
  skipAuthorities: _zod.z.boolean().default(false),
  // Only select tokens
  calculateFee: _zod.z.boolean().default(false) // For token creation
});
const ConfigInstruction = exports.ConfigInstruction = _zod.z.object({
  type: _zod.z.literal('action/config'),
  version: TemplateRef.or(_zod.z.number().gte(0).lte(0xff).optional()),
  signalBits: TemplateRef.or(_zod.z.number().gte(0).lte(0xff).optional()),
  createToken: TemplateRef.or(_zod.z.boolean().optional()),
  tokenName: TemplateRef.or(_zod.z.string().min(1).max(30).optional()),
  tokenSymbol: TemplateRef.or(_zod.z.string().min(1).max(5).optional())
});
const SetVarGetWalletAddressOpts = exports.SetVarGetWalletAddressOpts = _zod.z.object({
  method: _zod.z.literal('get_wallet_address'),
  index: _zod.z.number().optional()
});
const SetVarGetOracleScriptOpts = exports.SetVarGetOracleScriptOpts = _zod.z.object({
  method: _zod.z.literal('get_oracle_script'),
  index: _zod.z.number()
});
const SetVarGetOracleSignedDataOpts = exports.SetVarGetOracleSignedDataOpts = _zod.z.object({
  method: _zod.z.literal('get_oracle_signed_data'),
  index: _zod.z.number(),
  type: _zod.z.string(),
  data: TemplateRef.or(_zod.z.unknown()),
  ncId: TemplateRef.or(TxIdSchema)
});
const SetVarGetWalletBalanceOpts = exports.SetVarGetWalletBalanceOpts = _zod.z.object({
  method: _zod.z.literal('get_wallet_balance'),
  token: TemplateRef.or(TokenSchema.default('00')),
  authority: _zod.z.enum(['mint', 'melt']).optional()
});
const SetVarCallArgs = exports.SetVarCallArgs = _zod.z.discriminatedUnion('method', [SetVarGetWalletAddressOpts, SetVarGetWalletBalanceOpts, SetVarGetOracleScriptOpts, SetVarGetOracleSignedDataOpts]);
const SetVarInstruction = exports.SetVarInstruction = _zod.z.object({
  type: _zod.z.literal('action/setvar'),
  name: _zod.z.string().regex(TEMPLATE_REFERENCE_NAME_RE),
  value: _zod.z.unknown().optional(),
  call: SetVarCallArgs.optional()
});
const NanoDepositAction = exports.NanoDepositAction = _zod.z.object({
  action: _zod.z.literal('deposit'),
  token: TemplateRef.or(TokenSchema.default('00')),
  useCreatedToken: _zod.z.boolean().default(false),
  amount: TemplateRef.or(AmountSchema),
  address: TemplateRef.or(AddressSchema.optional()),
  autoChange: _zod.z.boolean().default(true),
  changeAddress: TemplateRef.or(AddressSchema.optional()),
  skipSelection: _zod.z.boolean().default(false)
});
const NanoWithdrawalAction = exports.NanoWithdrawalAction = _zod.z.object({
  action: _zod.z.literal('withdrawal'),
  token: TemplateRef.or(TokenSchema.default('00')),
  amount: TemplateRef.or(AmountSchema),
  address: TemplateRef.or(AddressSchema.optional()),
  skipOutputs: _zod.z.boolean().default(false)
});
const NanoGrantAuthorityAction = exports.NanoGrantAuthorityAction = _zod.z.object({
  action: _zod.z.literal('grant_authority'),
  token: TemplateRef.or(CustomTokenSchema),
  useCreatedToken: _zod.z.boolean().default(false),
  authority: _zod.z.enum(['mint', 'melt']),
  address: TemplateRef.or(AddressSchema.optional()),
  createAnotherTo: TemplateRef.or(AddressSchema.optional()),
  skipSelection: _zod.z.boolean().default(false)
});
const NanoAcquireAuthorityAction = exports.NanoAcquireAuthorityAction = _zod.z.object({
  action: _zod.z.literal('acquire_authority'),
  token: TemplateRef.or(CustomTokenSchema),
  authority: _zod.z.enum(['mint', 'melt']),
  address: TemplateRef.or(AddressSchema.optional()),
  skipOutputs: _zod.z.boolean().default(false)
});
const NanoAction = exports.NanoAction = _zod.z.union([NanoDepositAction, NanoWithdrawalAction, NanoGrantAuthorityAction, NanoAcquireAuthorityAction]);
const NanoMethodInstruction = exports.NanoMethodInstruction = _zod.z.object({
  type: _zod.z.literal('nano/execute'),
  // Nano Contract id or Blueprint id, depending on the method
  id: TemplateRef.or(Sha256HexSchema),
  method: _zod.z.string(),
  args: TemplateRef.or(_zod.z.unknown()).array().default([]),
  caller: TemplateRef.or(AddressSchema),
  actions: NanoAction.array().default([])
});
const TxTemplateInstruction = exports.TxTemplateInstruction = _zod.z.discriminatedUnion('type', [RawInputInstruction, UtxoSelectInstruction, AuthoritySelectInstruction, RawOutputInstruction, DataOutputInstruction, TokenOutputInstruction, AuthorityOutputInstruction, ShuffleInstruction, CompleteTxInstruction, ConfigInstruction, SetVarInstruction, NanoMethodInstruction]);
const TransactionTemplate = exports.TransactionTemplate = _zod.z.array(TxTemplateInstruction);