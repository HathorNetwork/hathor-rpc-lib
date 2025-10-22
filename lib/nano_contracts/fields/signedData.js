"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UserSignedDataSchema = exports.SignedDataField = void 0;
var _zod = require("zod");
var _base = require("./base");
var _bytes = require("./bytes");
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ /* eslint class-methods-use-this: ["error", { "exceptMethods": ["getType"] }] */
/**
 * A schema to validate that the user sent unknown data is a valid IUserSignedData.
 */
const UserSignedDataSchema = exports.UserSignedDataSchema = _zod.z.object({
  type: _zod.z.string(),
  signature: _zod.z.string().regex(/^[a-fA-F0-9]*$/),
  value: _zod.z.unknown()
}).transform(data => ({
  ...data,
  value: data.value === undefined ? null : data.value
}));
class SignedDataField extends _base.NCFieldBase {
  constructor(inner, type, signature, value) {
    super();
    _defineProperty(this, "value", void 0);
    _defineProperty(this, "inner", void 0);
    this.value = {
      type,
      signature,
      value
    };
    this.inner = inner;
  }
  getType() {
    return 'SignedData';
  }
  static new(inner, type) {
    return new SignedDataField(inner, type, Buffer.alloc(0), undefined);
  }
  createNew() {
    return SignedDataField.new(this.inner.createNew(), this.value.type);
  }
  fromBuffer(buf) {
    const result = this.inner.fromBuffer(buf);
    const sigBuf = buf.subarray(result.bytesRead);
    const sigResult = _bytes.BytesField.new().fromBuffer(sigBuf);
    this.value.signature = sigResult.value;
    this.value.value = result.value;
    return {
      value: {
        ...this.value
      },
      bytesRead: result.bytesRead + sigResult.bytesRead
    };
  }
  toBuffer() {
    const signature = new _bytes.BytesField(this.value.signature);
    return Buffer.concat([this.inner.toBuffer(), signature.toBuffer()]);
  }
  fromUser(data) {
    const parsed = UserSignedDataSchema.parse(data);
    if (parsed.type !== this.value.type) {
      throw new Error(`Expected ${this.value.type} but received ${parsed.type}`);
    }
    this.inner.fromUser(parsed.value);
    const signature = _zod.z.string().regex(/^[a-fA-F0-9]*$/).transform(s => Buffer.from(s, 'hex')).parse(parsed.signature);
    this.value = {
      type: parsed.type,
      signature,
      value: this.inner.value
    };
    return this;
  }
  toUser() {
    return {
      type: this.value.type,
      signature: this.value.signature.toString('hex'),
      value: this.inner.toUser()
    };
  }
}
exports.SignedDataField = SignedDataField;