"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.selectAuthorities = selectAuthorities;
exports.selectTokens = selectTokens;
var _constants = require("../../constants");
var _address = require("../../utils/address");
var _input = _interopRequireDefault(require("../../models/input"));
var _output = _interopRequireDefault(require("../../models/output"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Select tokens from interpreter and modify context as required by the tokens found.
 */
async function selectTokens(interpreter, ctx, amount, options, autoChange, changeAddress, position = -1) {
  const token = options.token ?? _constants.NATIVE_TOKEN_UID;
  const {
    changeAmount,
    utxos
  } = await interpreter.getUtxos(amount, options);

  // Add utxos as inputs on the transaction
  const inputs = [];
  for (const utxo of utxos) {
    ctx.log(`Found utxo with ${utxo.value} of ${utxo.tokenId}`);
    ctx.log(`Create input ${utxo.index} / ${utxo.txId}`);
    inputs.push(new _input.default(utxo.txId, utxo.index));
    // Update the balance
    const origTx = await interpreter.getTx(utxo.txId);
    ctx.balance.addBalanceFromUtxo(origTx, utxo.index);
  }

  // Then add inputs to context
  ctx.addInputs(position, ...inputs);
  ctx.log(`changeAmount: ${changeAmount} autoChange(${autoChange})`);
  if (autoChange && changeAmount) {
    ctx.log(`Creating change for address: ${changeAddress}`);
    // Token should only be on the array if present on the outputs
    const tokenData = ctx.addToken(token);
    const script = (0, _address.createOutputScriptFromAddress)(changeAddress, interpreter.getNetwork());
    const output = new _output.default(changeAmount, script, {
      tokenData
    });
    ctx.balance.addOutput(changeAmount, token);
    ctx.addOutputs(-1, output);
  }
}

/**
 * Select authorities from interpreter and modify context as required by the selection.
 */
async function selectAuthorities(interpreter, ctx, options, count = 1, position = -1) {
  const token = options.token ?? _constants.NATIVE_TOKEN_UID;
  const utxos = await interpreter.getAuthorities(count, options);

  // Add utxos as inputs on the transaction
  const inputs = [];
  for (const utxo of utxos) {
    ctx.log(`Found authority utxo ${utxo.authorities} of ${token}`);
    ctx.log(`Create input ${utxo.index} / ${utxo.txId}`);
    inputs.push(new _input.default(utxo.txId, utxo.index));
    // Update the balance
    const origTx = await interpreter.getTx(utxo.txId);
    ctx.balance.addBalanceFromUtxo(origTx, utxo.index);
  }

  // Then add inputs to context
  ctx.addInputs(position, ...inputs);
}