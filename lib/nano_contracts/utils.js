"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getOracleInputData = exports.getOracleBuffer = void 0;
exports.getOracleSignedDataFromUser = getOracleSignedDataFromUser;
exports.validateAndParseBlueprintMethodArgs = exports.unsafeGetOracleInputData = exports.prepareNanoSendTransaction = exports.mapActionToActionHeader = exports.isNanoContractCreateTx = void 0;
var _lodash = require("lodash");
var _bitcoreLib = require("bitcore-lib");
var _zod = require("zod");
var _transaction = _interopRequireDefault(require("../utils/transaction"));
var _tokens = _interopRequireDefault(require("../utils/tokens"));
var _sendTransaction = _interopRequireDefault(require("../new/sendTransaction"));
var _script_data = _interopRequireDefault(require("../models/script_data"));
var _nano = _interopRequireDefault(require("../api/nano"));
var _buffer = require("../utils/buffer");
var _p2pkh = _interopRequireDefault(require("../models/p2pkh"));
var _p2sh = _interopRequireDefault(require("../models/p2sh"));
var _address = _interopRequireDefault(require("../models/address"));
var _errors = require("../errors");
var _types = require("../wallet/types");
var _scripts = require("../utils/scripts");
var _types2 = require("./types");
var _constants = require("../constants");
var _parser = require("./ncTypes/parser");
var _fields = require("./fields");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Sign a transaction and create a send transaction object
 *
 * @param tx Transaction to sign and send
 * @param pin Pin to decrypt data
 * @param storage Wallet storage object
 */
const prepareNanoSendTransaction = async (tx, pin, storage) => {
  await _transaction.default.signTransaction(tx, storage, pin);
  tx.prepareToSend();

  // Create and return a send transaction object
  return new _sendTransaction.default({
    storage,
    transaction: tx,
    pin
  });
};

/**
 * Get oracle buffer from oracle string (address in base58 or oracle data directly in hex)
 *
 * @param oracle Address in base58 or oracle data directly in hex
 * @param network Network to calculate the address
 */
exports.prepareNanoSendTransaction = prepareNanoSendTransaction;
const getOracleBuffer = (oracle, network) => {
  const address = new _address.default(oracle, {
    network
  });
  // First check if the oracle is a base58 address
  // In case of success, set the output script as oracle
  // Otherwise, it's a custom script in hexadecimal
  if (address.isValid()) {
    const outputScriptType = address.getType();
    let outputScript;
    if (outputScriptType === _types.OutputType.P2PKH) {
      outputScript = new _p2pkh.default(address);
    } else if (outputScriptType === _types.OutputType.P2SH) {
      outputScript = new _p2sh.default(address);
    } else {
      throw new _errors.OracleParseError('Invalid output script type.');
    }
    return outputScript.createScript();
  }

  // Oracle script is a custom script
  try {
    return (0, _buffer.hexToBuffer)(oracle);
  } catch (err) {
    // Invalid hex
    throw new _errors.OracleParseError('Invalid hex value for oracle script.');
  }
};

/**
 * Get SignedData argument to use with a nano contract.
 *
 * @param oracleData Oracle data
 * @param contractId Id of the nano contract being invoked
 * @param argType Full method argument type string, e.g. 'SignedData[str]'
 * @param value Value to sign
 * @param wallet Hathor Wallet object
 */
exports.getOracleBuffer = getOracleBuffer;
async function getOracleSignedDataFromUser(oracleData, contractId, argType, value, wallet) {
  const field = (0, _parser.getFieldParser)(argType, wallet.getNetworkObject());
  if (!(0, _fields.isSignedDataField)(field)) {
    throw new Error('Type is not SignedData');
  }
  // Read user value.
  field.inner.fromUser(value);
  // Serialize user value
  const serialized = field.inner.toBuffer();
  // Sign user value
  const signature = await getOracleInputData(oracleData, contractId, serialized, wallet);
  field.fromUser({
    type: field.value.type,
    // Type is pre-filled during parser contruction
    signature: signature.toString('hex'),
    value
  });
  return field.toUser();
}

/**
 * Get oracle input data
 *
 * @param oracleData Oracle data
 * @param contractId Id of the nano contract being invoked
 * @param resultSerialized Result to sign with oracle data already serialized
 * @param wallet Hathor Wallet object
 */
const getOracleInputData = async (oracleData, contractId, resultSerialized, wallet) => {
  const ncId = Buffer.from(contractId, 'hex');
  const actualValue = Buffer.concat([ncId, resultSerialized]);
  return unsafeGetOracleInputData(oracleData, actualValue, wallet);
};

/**
 * [unsafe] Get oracle input data, signs received data raw.
 * This is meant to be used for RawSignedData
 *
 * @param oracleData Oracle data
 * @param resultSerialized Result to sign with oracle data already serialized
 * @param wallet Hathor Wallet object
 */
exports.getOracleInputData = getOracleInputData;
const unsafeGetOracleInputData = async (oracleData, resultSerialized, wallet) => {
  // Parse oracle script to validate if it's an address of this wallet
  const parsedOracleScript = (0, _scripts.parseScript)(oracleData, wallet.getNetworkObject());
  if (parsedOracleScript && !(parsedOracleScript instanceof _script_data.default)) {
    if (await wallet.storage.isReadonly()) {
      throw new _errors.WalletFromXPubGuard('getOracleInputData');
    }

    // This is only when the oracle is an address, otherwise we will have the signed input data
    const address = parsedOracleScript.address.base58;
    if (!wallet.isAddressMine(address)) {
      throw new _errors.OracleParseError('Oracle address is not from the loaded wallet.');
    }
    const oracleKey = await wallet.getPrivateKeyFromAddress(address);
    const signatureOracle = _transaction.default.getSignature(_bitcoreLib.crypto.Hash.sha256(resultSerialized), oracleKey);
    const oraclePubKeyBuffer = oracleKey.publicKey.toBuffer();
    return _transaction.default.createInputData(signatureOracle, oraclePubKeyBuffer);
  }

  // If it's not an address, we use the oracleInputData as the inputData directly
  return oracleData;
};

/**
 * Validate if nano contracts arguments match the expected ones from the blueprint method
 * It also converts arguments that come from clients in a different type than the expected,
 * e.g., bytes come as hexadecimal strings and address (bytes) come as base58 string.
 * We convert them to the expected type and update the original array of arguments
 *
 * @param blueprintId Blueprint ID
 * @param method Method name
 * @param args Arguments of the method to check if have the expected types
 *
 * @throws NanoRequest404Error in case the blueprint ID does not exist on the full node
 */
exports.unsafeGetOracleInputData = unsafeGetOracleInputData;
const validateAndParseBlueprintMethodArgs = async (blueprintId, method, args, network) => {
  // Get the blueprint data from full node
  const blueprintInformation = await _nano.default.getBlueprintInformation(blueprintId);
  const methodArgs = (0, _lodash.get)(blueprintInformation, `public_methods.${method}.args`, []);
  if (!methodArgs) {
    throw new _errors.NanoContractTransactionError(`Blueprint does not have method ${method}.`);
  }
  if (args == null) {
    throw new _errors.NanoContractTransactionError(`No arguments were received.`);
  }
  const argsLen = args.length;
  if (argsLen !== methodArgs.length) {
    throw new _errors.NanoContractTransactionError(`Method needs ${methodArgs.length} parameters but data has ${args.length}.`);
  }
  try {
    const parsedArgs = [];
    for (const [index, arg] of methodArgs.entries()) {
      const field = (0, _parser.getFieldParser)(arg.type, network);
      field.fromUser(args[index]);
      parsedArgs.push({
        ...arg,
        field
      });
    }
    return parsedArgs;
  } catch (err) {
    if (err instanceof _zod.z.ZodError || err instanceof Error) {
      throw new _errors.NanoContractTransactionError(err.message);
    }
    throw err;
  }
};

/**
 * Checks if a transaction is a nano contract create transaction
 *
 * @param tx History object from hathor core to check if it's a nano create tx
 */
exports.validateAndParseBlueprintMethodArgs = validateAndParseBlueprintMethodArgs;
const isNanoContractCreateTx = tx => {
  return tx.nc_method === _constants.NANO_CONTRACTS_INITIALIZE_METHOD;
};

/**
 * Map a NanoContractAction object to NanoContractActionHeader
 *
 * @param action The action object to be mapped
 * @param tokens The tokens array to be used in the mapping
 *
 * @return The mapped action header object
 */
exports.isNanoContractCreateTx = isNanoContractCreateTx;
const mapActionToActionHeader = (action, tokens) => {
  const headerActionType = _types2.ActionTypeToActionHeaderType[action.type];
  const mappedTokens = tokens.map(token => {
    return {
      uid: token,
      name: '',
      symbol: ''
    };
  });
  let amount;
  if (action.type === _types2.NanoContractActionType.GRANT_AUTHORITY || action.type === _types2.NanoContractActionType.ACQUIRE_AUTHORITY) {
    amount = action.authority === 'mint' ? _constants.TOKEN_MINT_MASK : _constants.TOKEN_MELT_MASK;
  } else if (action.type === _types2.NanoContractActionType.DEPOSIT || action.type === _types2.NanoContractActionType.WITHDRAWAL) {
    amount = action.amount;
  } else {
    throw new Error('Invalid nano contract action type');
  }
  return {
    type: headerActionType,
    amount,
    tokenIndex: _tokens.default.getTokenIndex(mappedTokens, action.token)
  };
};
exports.mapActionToActionHeader = mapActionToActionHeader;