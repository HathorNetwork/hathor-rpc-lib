"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TokenUidField = void 0;
var _zod = require("zod");
var _constants = require("../../constants");
var _base = require("./base");
var _encoding = require("./encoding");
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ /* eslint class-methods-use-this: ["error", { "exceptMethods": ["getType", "createNew"] }] */
const TokenUidSchema = _zod.z.union([_zod.z.literal('00'), _zod.z.string().regex(/^[a-fA-F0-9]{64}$/)]);
class TokenUidField extends _base.NCFieldBase {
  constructor(value) {
    super();
    _defineProperty(this, "value", void 0);
    this.value = value;
  }
  getType() {
    return 'TokenUid';
  }
  static new() {
    return new TokenUidField(_constants.NATIVE_TOKEN_UID);
  }
  createNew() {
    return TokenUidField.new();
  }
  fromBuffer(buf) {
    if (buf[0] === 0x00) {
      this.value = _constants.NATIVE_TOKEN_UID;
      return {
        value: _constants.NATIVE_TOKEN_UID,
        bytesRead: 1
      };
    }
    if (buf[0] === 0x01) {
      const parsed = _encoding.sizedBytes.decode(32, buf.subarray(1));
      const value = parsed.value.toString('hex');
      this.value = value;
      return {
        value,
        bytesRead: 33
      };
    }
    throw new Error('Invalid TokenUid tag');
  }
  toBuffer() {
    TokenUidSchema.parse(this.value);
    if (this.value === _constants.NATIVE_TOKEN_UID) {
      return Buffer.from([0]);
    }
    return Buffer.concat([Buffer.from([1]), Buffer.from(this.value, 'hex')]);
  }
  fromUser(data) {
    const value = TokenUidSchema.parse(data);
    this.value = value;
    return this;
  }
  toUser() {
    return this.value;
  }
}
exports.TokenUidField = TokenUidField;