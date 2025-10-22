"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.CodeKind = exports.Code = void 0;
var _zlib = _interopRequireDefault(require("zlib"));
var _constants = require("../constants");
var _transaction = _interopRequireDefault(require("../models/transaction"));
var _buffer = require("../utils/buffer");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /* eslint-disable max-classes-per-file */ /**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
let CodeKind = exports.CodeKind = /*#__PURE__*/function (CodeKind) {
  CodeKind[CodeKind["PYTHON_ZLIB"] = 1] = "PYTHON_ZLIB";
  return CodeKind;
}({});
class Code {
  constructor(kind, content) {
    _defineProperty(this, "kind", void 0);
    _defineProperty(this, "content", void 0);
    this.kind = kind;
    this.content = content;
  }
  serialize() {
    // Code serialization format: [kind:variable bytes][null byte][data:variable bytes]
    const arr = [];
    if (this.kind !== CodeKind.PYTHON_ZLIB) {
      throw new Error('Invalid code kind value');
    }
    const zcode = _zlib.default.deflateSync(this.content);
    arr.push((0, _buffer.intToBytes)(this.kind, 1));
    arr.push(zcode);
    return Buffer.concat(arr);
  }
}

/**
 * The OnChainBlueprint class inherits the Transaction class, so it has all its attributes.
 *
 * We currently don't have support for creating an ocb object with inputs/outputs, so we receive as
 * parameters in the constructor only the data related to the ocb class itself.
 *
 * The code and the public key that will be used as caller to sign the transaction (just like the nano contract class).
 */
exports.Code = Code;
class OnChainBlueprint extends _transaction.default {
  constructor(code, pubkey, signature = null) {
    super([], []);
    // Code object with content
    _defineProperty(this, "code", void 0);
    _defineProperty(this, "pubkey", void 0);
    _defineProperty(this, "signature", void 0);
    this.version = _constants.ON_CHAIN_BLUEPRINTS_VERSION;
    this.code = code;
    this.pubkey = pubkey;
    this.signature = signature;
  }

  /**
   * Serialize funds fields
   * Add the serialized fields to the array parameter
   *
   * @param {array} Array of buffer to push the serialized fields
   * @param {addInputData} If should add input data or signature when serializing it
   *
   * @memberof OnChainBlueprint
   * @inner
   */
  serializeFundsFields(array, addInputData) {
    super.serializeFundsFields(array, addInputData);

    // Info version
    array.push((0, _buffer.intToBytes)(_constants.ON_CHAIN_BLUEPRINTS_INFO_VERSION, 1));

    // Code
    const serializedCode = this.code.serialize();
    array.push((0, _buffer.intToBytes)(serializedCode.length, 4));
    array.push(serializedCode);

    // Pubkey and signature
    array.push((0, _buffer.intToBytes)(this.pubkey.length, 1));
    array.push(this.pubkey);
    if (this.signature !== null && addInputData) {
      array.push((0, _buffer.intToBytes)(this.signature.length, 1));
      array.push(this.signature);
    } else {
      array.push((0, _buffer.intToBytes)(0, 1));
    }
  }

  /**
   * Serialize tx to bytes
   *
   * @memberof OnChainBlueprint
   * @inner
   */
  toBytes() {
    const arr = [];
    // Serialize first the funds part
    this.serializeFundsFields(arr, true);

    // Graph fields
    this.serializeGraphFields(arr);

    // Nonce
    this.serializeNonce(arr);
    return Buffer.concat(arr);
  }
}
var _default = exports.default = OnChainBlueprint;