"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OutputType = exports.ConnectionState = void 0;
/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// This is the output object to be used in the SendTransactionWalletService class
/**
 * Represents the Buffer-like script object in websocket transactions.
 */
/**
 * Represents the decoded part of a websocket transaction input.
 */
/**
 * Represents a websocket transaction input.
 */
/**
 * Represents the decoded part of a websocket transaction output.
 */
/**
 * Represents a websocket transaction output.
 */
let ConnectionState = exports.ConnectionState = /*#__PURE__*/function (ConnectionState) {
  ConnectionState[ConnectionState["CLOSED"] = 0] = "CLOSED";
  ConnectionState[ConnectionState["CONNECTING"] = 1] = "CONNECTING";
  ConnectionState[ConnectionState["CONNECTED"] = 2] = "CONNECTED";
  return ConnectionState;
}({});
let OutputType = exports.OutputType = /*#__PURE__*/function (OutputType) {
  OutputType["P2PKH"] = "p2pkh";
  OutputType["P2SH"] = "p2sh";
  OutputType["DATA"] = "data";
  return OutputType;
}({});