"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.wsTransactionSchema = exports.walletStatusResponseSchema = exports.walletApiSchemas = exports.txProposalUpdateResponseSchema = exports.txProposalOutputsSchema = exports.txProposalInputsSchema = exports.txProposalCreateResponseSchema = exports.txOutputSchema = exports.txOutputResponseSchema = exports.txInputSchema = exports.txByIdResponseSchema = exports.tokensResponseSchema = exports.tokenInfoSchema = exports.tokenIdSchema = exports.tokenDetailsResponseSchema = exports.newAddressesResponseSchema = exports.ncContextSchema = exports.ncActionSchema = exports.historyResponseSchema = exports.getBalanceObjectSchema = exports.getAddressesObjectSchema = exports.getAddressDetailsObjectSchema = exports.fullNodeVersionDataSchema = exports.fullNodeTxSchema = exports.fullNodeTxResponseSchema = exports.fullNodeTxConfirmationDataResponseSchema = exports.fullNodeTokenSchema = exports.fullNodeOutputSchema = exports.fullNodeMetaSchema = exports.fullNodeInputSchema = exports.checkAddressesMineResponseSchema = exports.balanceSchema = exports.balanceResponseSchema = exports.authorityBalanceSchema = exports.authTokenResponseSchema = exports.addressesResponseSchema = exports.addressInfoObjectSchema = exports.addressDetailsResponseSchema = exports.AddressSchema = exports.AddressPathSchema = void 0;
var _zod = require("zod");
var _constants = require("../../../constants");
var _schemas = require("../../../schemas");
var _bigint = require("../../../utils/bigint");
/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Schema for validating Hathor addresses.
 * Addresses are base58 encoded and must be 34-35 characters long.
 * They can only contain characters from the base58 alphabet.
 */
const AddressSchema = exports.AddressSchema = _zod.z.string().regex(/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{34,35}$/);

/**
 * Schema for validating BIP44 derivation paths.
 * Must start with 'm' followed by zero or more segments.
 * Each segment starts with '/' followed by numbers and may end with a single quote (').
 * Example: m/44'/280'/0'/0/0
 */
const AddressPathSchema = exports.AddressPathSchema = _zod.z.string().regex(/^m(\/\d+'?)*$/, 'Invalid BIP44 derivation path format');

/**
 * Base response schema that all API responses extend from.
 * Contains a success flag indicating if the operation was successful.
 */
const baseResponseSchema = _zod.z.object({
  success: _zod.z.boolean()
});

/**
 * Schema for individual address information.
 * Represents a single address in the wallet with its derivation index and transaction count.
 */
const getAddressesObjectSchema = exports.getAddressesObjectSchema = _zod.z.object({
  address: AddressSchema,
  // Address in base58
  index: _zod.z.number(),
  // derivation index of the address
  transactions: _zod.z.number() // quantity of transactions
});

/**
 * Response schema for getting all addresses in the wallet.
 */
const addressesResponseSchema = exports.addressesResponseSchema = baseResponseSchema.extend({
  addresses: _zod.z.array(getAddressesObjectSchema)
});

/**
 * Response schema for getting address info in the wallet.
 */
const getAddressDetailsObjectSchema = exports.getAddressDetailsObjectSchema = _zod.z.object({
  address: AddressSchema,
  index: _zod.z.number(),
  transactions: _zod.z.number(),
  seqnum: _zod.z.number()
});

/**
 * Response schema for getting address details in the wallet.
 */
const addressDetailsResponseSchema = exports.addressDetailsResponseSchema = baseResponseSchema.extend({
  data: getAddressDetailsObjectSchema
});

/**
 * Response schema for checking if addresses belong to the wallet.
 * Maps addresses to boolean values indicating ownership.
 */
const checkAddressesMineResponseSchema = exports.checkAddressesMineResponseSchema = baseResponseSchema.extend({
  addresses: _zod.z.record(AddressSchema, _zod.z.boolean()) // WalletAddressMap with validated address keys
});

/**
 * Schema for address information used in new address generation.
 */
const addressInfoObjectSchema = exports.addressInfoObjectSchema = _zod.z.object({
  address: AddressSchema,
  index: _zod.z.number(),
  addressPath: AddressPathSchema,
  info: _zod.z.string().optional()
}).strict();

/**
 * Response schema for generating new addresses.
 */
const newAddressesResponseSchema = exports.newAddressesResponseSchema = baseResponseSchema.extend({
  addresses: _zod.z.array(addressInfoObjectSchema)
});

/**
 * TokenId schema
 */
const tokenIdSchema = exports.tokenIdSchema = _zod.z.union([_schemas.txIdSchema, _zod.z.literal(_constants.NATIVE_TOKEN_UID)]);

/**
 * Schema for token information.
 */
const tokenInfoSchema = exports.tokenInfoSchema = _zod.z.object({
  id: tokenIdSchema,
  name: _zod.z.string(),
  symbol: _zod.z.string()
});

/**
 * Response schema for token details.
 * Contains information about a token's name, symbol, total supply, and authorities.
 */
const tokenDetailsResponseSchema = exports.tokenDetailsResponseSchema = baseResponseSchema.extend({
  details: _zod.z.object({
    tokenInfo: tokenInfoSchema,
    totalSupply: _bigint.bigIntCoercibleSchema,
    totalTransactions: _zod.z.number(),
    authorities: _zod.z.object({
      mint: _zod.z.boolean(),
      melt: _zod.z.boolean()
    })
  })
});

/**
 * Schema for token balance information.
 * Represents both unlocked and locked balances for a token.
 */
const balanceSchema = exports.balanceSchema = _zod.z.object({
  unlocked: _bigint.bigIntCoercibleSchema,
  locked: _bigint.bigIntCoercibleSchema
});

/**
 * Schema for token authority balances.
 * Represents mint and melt authority balances in both unlocked and locked states.
 */
const authorityBalanceSchema = exports.authorityBalanceSchema = _zod.z.object({
  unlocked: _zod.z.object({
    mint: _zod.z.boolean(),
    melt: _zod.z.boolean()
  }),
  locked: _zod.z.object({
    mint: _zod.z.boolean(),
    melt: _zod.z.boolean()
  })
});

/**
 * Schema for balance object.
 * Contains token info, balance, authorities, and transaction count.
 */
const getBalanceObjectSchema = exports.getBalanceObjectSchema = _zod.z.object({
  token: tokenInfoSchema,
  balance: balanceSchema,
  tokenAuthorities: authorityBalanceSchema,
  transactions: _zod.z.number(),
  lockExpires: _zod.z.number().nullable()
});

/**
 * Response schema for token balances.
 * Contains an array of balance objects for each token.
 */
const balanceResponseSchema = exports.balanceResponseSchema = baseResponseSchema.extend({
  balances: _zod.z.array(getBalanceObjectSchema)
});

/**
 * Schema for transaction proposal inputs.
 * Represents the inputs that will be used in a transaction.
 */
const txProposalInputsSchema = exports.txProposalInputsSchema = _zod.z.object({
  txId: _zod.z.string(),
  index: _zod.z.number(),
  addressPath: AddressPathSchema
});

/**
 * Schema for transaction proposal outputs.
 * Represents the outputs that will be created in a transaction.
 */
const txProposalOutputsSchema = exports.txProposalOutputsSchema = _zod.z.object({
  address: AddressSchema,
  value: _bigint.bigIntCoercibleSchema,
  token: tokenIdSchema,
  timelock: _zod.z.number().nullable()
});

/**
 * Response schema for creating a transaction proposal.
 * Contains the proposal ID and the transaction details.
 */
const txProposalCreateResponseSchema = exports.txProposalCreateResponseSchema = baseResponseSchema.extend({
  txProposalId: _zod.z.string(),
  inputs: _zod.z.array(txProposalInputsSchema)
});

/**
 * Response schema for updating a transaction proposal.
 * Contains the proposal ID and the transaction hex.
 */
const txProposalUpdateResponseSchema = exports.txProposalUpdateResponseSchema = baseResponseSchema.extend({
  txProposalId: _zod.z.string(),
  txHex: _zod.z.string()
});

/**
 * Schema for full node version data.
 * Contains network parameters and configuration values.
 * Uses passthrough() to allow additional fields in the response without breaking validation,
 * as the full node may add new fields in future versions without changing the API version.
 */
const fullNodeVersionDataSchema = exports.fullNodeVersionDataSchema = _zod.z.object({
  timestamp: _zod.z.number(),
  version: _zod.z.string(),
  network: _zod.z.string(),
  minWeight: _zod.z.number(),
  minTxWeight: _zod.z.number(),
  minTxWeightCoefficient: _zod.z.number(),
  minTxWeightK: _zod.z.number(),
  tokenDepositPercentage: _zod.z.number(),
  rewardSpendMinBlocks: _zod.z.number(),
  maxNumberInputs: _zod.z.number(),
  maxNumberOutputs: _zod.z.number(),
  decimalPlaces: _zod.z.number().nullable().optional(),
  genesisBlockHash: _zod.z.string().nullable().optional(),
  genesisTx1Hash: _zod.z.string().nullable().optional(),
  genesisTx2Hash: _zod.z.string().nullable().optional()
}).passthrough();

/**
 * Schema for full node transaction inputs.
 * Represents the inputs of a transaction as seen by the full node.
 */
const fullNodeInputSchema = exports.fullNodeInputSchema = _zod.z.object({
  value: _bigint.bigIntCoercibleSchema,
  token_data: _zod.z.number(),
  script: _zod.z.string(),
  decoded: _zod.z.object({
    type: _zod.z.string().nullable().optional(),
    address: AddressSchema.nullable().optional(),
    timelock: _zod.z.number().nullable().optional(),
    value: _bigint.bigIntCoercibleSchema.nullable().optional(),
    token_data: _zod.z.number().nullable().optional()
  }),
  tx_id: _schemas.txIdSchema,
  index: _zod.z.number(),
  token: tokenIdSchema.nullable().optional(),
  spent_by: _zod.z.string().nullable().optional()
});

/**
 * Schema for full node transaction outputs.
 * Represents the outputs of a transaction as seen by the full node.
 */
const fullNodeOutputSchema = exports.fullNodeOutputSchema = _zod.z.object({
  value: _bigint.bigIntCoercibleSchema,
  token_data: _zod.z.number(),
  script: _zod.z.string(),
  decoded: _zod.z.object({
    type: _zod.z.string().nullable().optional(),
    address: AddressSchema.nullable().optional(),
    timelock: _zod.z.number().nullable().optional(),
    value: _bigint.bigIntCoercibleSchema.nullable().optional(),
    token_data: _zod.z.number().nullable().optional()
  }),
  address: AddressSchema.nullable().optional(),
  token: tokenIdSchema.nullable().optional(),
  authorities: _bigint.bigIntCoercibleSchema.optional(),
  timelock: _zod.z.number().nullable().optional()
});

/**
 * Schema for full node token information.
 * Represents token details as seen by the full node.
 * Note: amount is optional because this schema is reused across different APIs:
 * - Regular transaction APIs include amount field
 * - Nano contract token creation APIs only include uid, name, and symbol
 */
const fullNodeTokenSchema = exports.fullNodeTokenSchema = _zod.z.object({
  uid: _zod.z.string(),
  name: _zod.z.string(),
  symbol: _zod.z.string(),
  amount: _bigint.bigIntCoercibleSchema.optional()
});

/**
 * Schema for nano contract context actions.
 */
const ncActionSchema = exports.ncActionSchema = _zod.z.object({
  type: _zod.z.string(),
  token_uid: _zod.z.string(),
  amount: _zod.z.number()
});

/**
 * Schema for nano contract context.
 */
const ncContextSchema = exports.ncContextSchema = _zod.z.object({
  actions: _zod.z.array(ncActionSchema),
  address: AddressSchema,
  timestamp: _zod.z.number()
});

/**
 * Schema for full node transaction data.
 * Contains all information about a transaction as seen by the full node.
 */
const fullNodeTxSchema = exports.fullNodeTxSchema = _zod.z.object({
  hash: _zod.z.string(),
  nonce: _zod.z.string(),
  timestamp: _zod.z.number(),
  version: _zod.z.number(),
  weight: _zod.z.number(),
  signal_bits: _zod.z.number().optional(),
  parents: _zod.z.array(_zod.z.string()),
  inputs: _zod.z.array(fullNodeInputSchema),
  outputs: _zod.z.array(fullNodeOutputSchema),
  tokens: _zod.z.array(fullNodeTokenSchema),
  token_name: _zod.z.string().nullable().optional(),
  token_symbol: _zod.z.string().nullable().optional(),
  nc_id: _zod.z.string().optional(),
  nc_seqnum: _zod.z.number().optional(),
  nc_blueprint_id: _zod.z.string().optional(),
  nc_method: _zod.z.string().optional(),
  nc_args: _zod.z.string().optional(),
  nc_address: AddressSchema.optional(),
  nc_context: ncContextSchema.optional(),
  raw: _zod.z.string()
});

/**
 * Schema for full node transaction metadata.
 * Contains additional information about a transaction's status and relationships.
 */
const fullNodeMetaSchema = exports.fullNodeMetaSchema = _zod.z.object({
  hash: _zod.z.string(),
  received_by: _zod.z.array(_zod.z.string()),
  children: _zod.z.array(_zod.z.string()),
  conflict_with: _zod.z.array(_zod.z.string()),
  first_block: _zod.z.string().nullable(),
  height: _zod.z.number(),
  voided_by: _zod.z.array(_zod.z.string()),
  spent_outputs: _zod.z.array(_zod.z.tuple([_zod.z.number(), _zod.z.array(_zod.z.string())])),
  received_timestamp: _zod.z.number().nullable().optional(),
  is_voided: _zod.z.boolean().optional(),
  verification_status: _zod.z.string().optional(),
  twins: _zod.z.array(_zod.z.string()),
  accumulated_weight: _zod.z.number(),
  score: _zod.z.number()
});

/**
 * Response schema for full node transaction data.
 * Contains the transaction details, metadata, and optional message.
 */
const fullNodeTxResponseSchema = exports.fullNodeTxResponseSchema = baseResponseSchema.extend({
  tx: fullNodeTxSchema,
  meta: fullNodeMetaSchema,
  message: _zod.z.string().optional(),
  spent_outputs: _zod.z.record(_zod.z.string()).optional()
});

/**
 * Response schema for transaction confirmation data.
 * Contains information about the transaction's confirmation status and weight.
 */
const fullNodeTxConfirmationDataResponseSchema = exports.fullNodeTxConfirmationDataResponseSchema = baseResponseSchema.extend({
  accumulated_weight: _zod.z.number(),
  accumulated_bigger: _zod.z.boolean(),
  stop_value: _zod.z.number(),
  confirmation_level: _zod.z.number()
});

/**
 * Response schema for wallet status.
 * Contains information about the wallet's current state.
 */
const walletStatusResponseSchema = exports.walletStatusResponseSchema = baseResponseSchema.extend({
  status: _zod.z.object({
    walletId: _zod.z.string(),
    xpubkey: _zod.z.string(),
    status: _zod.z.string(),
    maxGap: _zod.z.number(),
    createdAt: _zod.z.number(),
    readyAt: _zod.z.number().nullable()
  }),
  error: _zod.z.string().optional()
});

/**
 * Response schema for token list.
 * Contains an array of token information.
 */
const tokensResponseSchema = exports.tokensResponseSchema = baseResponseSchema.extend({
  tokens: _zod.z.array(_zod.z.string())
});

/**
 * Response schema for transaction history.
 * Contains an array of transaction information.
 */
const historyResponseSchema = exports.historyResponseSchema = baseResponseSchema.extend({
  history: _zod.z.array(_zod.z.object({
    txId: _zod.z.string(),
    balance: _bigint.bigIntCoercibleSchema,
    timestamp: _zod.z.number(),
    voided: _zod.z.number().transform(val => val === 1),
    version: _zod.z.number()
  }))
});

/**
 * Response schema for transaction outputs.
 * Contains an array of unspent transaction outputs.
 */
const txOutputResponseSchema = exports.txOutputResponseSchema = baseResponseSchema.extend({
  txOutputs: _zod.z.array(_zod.z.object({
    txId: _zod.z.string(),
    index: _zod.z.number(),
    tokenId: _zod.z.string(),
    address: AddressSchema,
    value: _bigint.bigIntCoercibleSchema,
    authorities: _bigint.bigIntCoercibleSchema,
    timelock: _zod.z.number().nullable(),
    heightlock: _zod.z.number().nullable(),
    locked: _zod.z.boolean(),
    addressPath: AddressPathSchema
  }))
});

/**
 * Response schema for authentication token.
 * Contains the authentication token.
 */
const authTokenResponseSchema = exports.authTokenResponseSchema = baseResponseSchema.extend({
  token: _zod.z.string().regex(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+$/, 'Invalid JWT token format')
});

/**
 * Schema for transaction by ID response.
 * Contains detailed information about a specific transaction.
 */
const txByIdResponseSchema = exports.txByIdResponseSchema = baseResponseSchema.extend({
  txTokens: _zod.z.array(_zod.z.object({
    txId: _zod.z.string(),
    timestamp: _zod.z.number(),
    version: _zod.z.number(),
    voided: _zod.z.boolean(),
    height: _zod.z.number().nullable().optional(),
    weight: _zod.z.number(),
    balance: _bigint.bigIntCoercibleSchema,
    tokenId: _zod.z.string(),
    tokenName: _zod.z.string(),
    tokenSymbol: _zod.z.string()
  }))
});

/**
 * Schema for transaction input.
 * Represents a transaction input with its decoded data.
 */
const txInputSchema = exports.txInputSchema = _zod.z.object({
  tx_id: _schemas.txIdSchema,
  index: _zod.z.number(),
  value: _bigint.bigIntCoercibleSchema,
  token_data: _zod.z.number(),
  script: _zod.z.string(),
  decoded: _zod.z.object({
    type: _zod.z.string(),
    address: AddressSchema,
    timelock: _zod.z.number().nullable().optional(),
    value: _bigint.bigIntCoercibleSchema,
    token_data: _zod.z.number()
  })
});

/**
 * Schema for transaction output.
 * Represents a transaction output with its decoded data.
 */
const txOutputSchema = exports.txOutputSchema = _zod.z.object({
  index: _zod.z.number(),
  value: _bigint.bigIntCoercibleSchema,
  token_data: _zod.z.number(),
  script: _zod.z.string(),
  decoded: _zod.z.object({
    type: _zod.z.string().nullable().optional(),
    address: AddressSchema.optional(),
    timelock: _zod.z.number().nullable().optional(),
    value: _bigint.bigIntCoercibleSchema,
    token_data: _zod.z.number().optional()
  })
});

/**
 * Schema for Buffer-like scripts
 */
const bufferScriptSchema = _zod.z.object({
  type: _zod.z.literal('Buffer'),
  data: _zod.z.array(_zod.z.number())
});

/**
 * Schema for websocket transaction input.
 */
const wsTxInputSchema = _zod.z.object({
  tx_id: _schemas.txIdSchema,
  index: _zod.z.number(),
  value: _bigint.bigIntCoercibleSchema,
  token_data: _zod.z.number(),
  script: bufferScriptSchema,
  token: tokenIdSchema,
  decoded: _zod.z.object({
    type: _zod.z.string(),
    address: AddressSchema,
    timelock: _zod.z.number().nullable().optional()
  })
});

/**
 * Schema for websocket transaction output.
 */
const wsTxOutputSchema = _zod.z.object({
  value: _bigint.bigIntCoercibleSchema,
  token_data: _zod.z.number(),
  script: bufferScriptSchema,
  decodedScript: _zod.z.any().nullable().optional(),
  token: tokenIdSchema,
  locked: _zod.z.boolean(),
  index: _zod.z.number(),
  decoded: _zod.z.object({
    type: _zod.z.string().nullable().optional(),
    address: AddressSchema.optional(),
    timelock: _zod.z.number().nullable().optional()
  })
});

/**
 * Schema for websocket transaction events.
 * Represents the structure of transactions received via websocket.
 */
const wsTransactionSchema = exports.wsTransactionSchema = _zod.z.object({
  tx_id: _schemas.txIdSchema,
  nonce: _zod.z.number(),
  timestamp: _zod.z.number(),
  version: _zod.z.number(),
  voided: _zod.z.boolean(),
  weight: _zod.z.number(),
  parents: _zod.z.array(_zod.z.string()),
  inputs: _zod.z.array(wsTxInputSchema),
  outputs: _zod.z.array(wsTxOutputSchema),
  height: _zod.z.number().nullable().optional(),
  token_name: _zod.z.string().nullable(),
  token_symbol: _zod.z.string().nullable(),
  signal_bits: _zod.z.number()
});

/**
 * Collection of all wallet API schemas.
 * Used for type validation and documentation of the wallet API.
 */
const walletApiSchemas = exports.walletApiSchemas = {
  addressesResponse: addressesResponseSchema,
  checkAddressesMineResponse: checkAddressesMineResponseSchema,
  newAddressesResponse: newAddressesResponseSchema,
  tokenDetailsResponse: tokenDetailsResponseSchema,
  balanceResponse: balanceResponseSchema,
  txProposalCreateResponse: txProposalCreateResponseSchema,
  txProposalUpdateResponse: txProposalUpdateResponseSchema,
  fullNodeVersionData: fullNodeVersionDataSchema,
  fullNodeTxResponse: fullNodeTxResponseSchema,
  fullNodeTxConfirmationDataResponse: fullNodeTxConfirmationDataResponseSchema,
  walletStatusResponse: walletStatusResponseSchema,
  tokensResponse: tokensResponseSchema,
  historyResponse: historyResponseSchema,
  txOutputResponse: txOutputResponseSchema,
  authTokenResponse: authTokenResponseSchema,
  txByIdResponse: txByIdResponseSchema,
  wsTransaction: wsTransactionSchema
};