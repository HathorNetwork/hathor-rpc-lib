"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _lodash = require("lodash");
var _address = _interopRequireDefault(require("../models/address"));
var _nano = _interopRequireDefault(require("../api/nano"));
var _errors = require("../errors");
var _leb = _interopRequireDefault(require("../utils/leb128"));
var _parser = require("./ncTypes/parser");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
class NanoContractTransactionParser {
  constructor(blueprintId, method, address, network, args) {
    _defineProperty(this, "blueprintId", void 0);
    _defineProperty(this, "method", void 0);
    _defineProperty(this, "network", void 0);
    _defineProperty(this, "address", void 0);
    _defineProperty(this, "args", void 0);
    _defineProperty(this, "parsedArgs", void 0);
    this.blueprintId = blueprintId;
    this.method = method;
    this.args = args;
    this.network = network;
    this.address = new _address.default(address, {
      network: this.network
    });
    this.parsedArgs = null;
  }

  /**
   * Parse the arguments in hex into a list of parsed arguments
   *
   * @memberof NanoContractTransactionParser
   * @inner
   */
  async parseArguments() {
    const parsedArgs = [];
    if (!this.args) {
      return;
    }

    // Get the blueprint data from full node
    const blueprintInformation = await _nano.default.getBlueprintInformation(this.blueprintId);
    if (!(0, _lodash.has)(blueprintInformation, `public_methods.${this.method}`)) {
      // If this.method is not in the blueprint information public methods, then there's an error
      throw new _errors.NanoContractTransactionParseError('Failed to parse nano contract transaction. Method not found.');
    }
    const methodArgs = (0, _lodash.get)(blueprintInformation, `public_methods.${this.method}.args`, []);
    let argsBuffer = Buffer.from(this.args, 'hex');

    // Number of arguments
    const numArgsReadResult = _leb.default.decodeUnsigned(argsBuffer);
    const numArgs = Number(numArgsReadResult.value);
    argsBuffer = numArgsReadResult.rest;
    if (numArgs !== methodArgs.length) {
      throw new _errors.NanoContractTransactionParseError(`Number of arguments do not match blueprint.`);
    }
    if (methodArgs.length === 0) {
      return;
    }
    for (const arg of methodArgs) {
      let parsed;
      let size;
      try {
        const field = (0, _parser.getFieldParser)(arg.type, this.network);
        const result = field.fromBuffer(argsBuffer);
        parsed = {
          ...arg,
          value: field.toUser()
        };
        size = result.bytesRead;
      } catch (err) {
        throw new _errors.NanoContractTransactionParseError(`Failed to deserialize argument ${arg.type}.`);
      }
      parsedArgs.push(parsed);
      argsBuffer = argsBuffer.subarray(size);
    }
    if (argsBuffer.length !== 0) {
      throw new Error(`${argsBuffer.length} bytes left after parsing all arguments.`);
    }
    this.parsedArgs = parsedArgs;
  }
}
var _default = exports.default = NanoContractTransactionParser;