"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getOracleScript = getOracleScript;
exports.getOracleSignedData = getOracleSignedData;
exports.getWalletAddress = getWalletAddress;
exports.getWalletBalance = getWalletBalance;
var _instructions = require("./instructions");
var _utils = require("../../nano_contracts/utils");
/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

async function getWalletAddress(interpreter, _ctx, options) {
  if (options.index) {
    return interpreter.getAddressAtIndex(options.index);
  }
  return interpreter.getAddress();
}
async function getWalletBalance(interpreter, _ctx, options) {
  const data = await interpreter.getBalance(options.token);
  switch (options.authority) {
    case 'mint':
      return data.tokenAuthorities.unlocked.mint;
    case 'melt':
      return data.tokenAuthorities.unlocked.melt;
    default:
      return data.balance.unlocked;
  }
}
async function getOracleScript(interpreter, _ctx, options) {
  const address = await interpreter.getAddressAtIndex(options.index);
  const oracle = (0, _utils.getOracleBuffer)(address, interpreter.getNetwork());
  return oracle.toString('hex');
}
async function getOracleSignedData(interpreter, _ctx, options) {
  const address = await interpreter.getAddressAtIndex(options.index);
  const oracle = (0, _utils.getOracleBuffer)(address, interpreter.getNetwork());
  const data = (0, _instructions.getVariable)(options.data, _ctx.vars, _instructions.SetVarGetOracleSignedDataOpts.shape.data);
  const ncId = (0, _instructions.getVariable)(options.ncId, _ctx.vars, _instructions.SetVarGetOracleSignedDataOpts.shape.ncId);
  return (0, _utils.getOracleSignedDataFromUser)(oracle, ncId, options.type, data, interpreter.getWallet());
}