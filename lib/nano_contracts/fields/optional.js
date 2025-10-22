"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OptionalField = void 0;
var _base = require("./base");
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ /* eslint class-methods-use-this: ["error", { "exceptMethods": ["getType"] }] */
class OptionalField extends _base.NCFieldBase {
  constructor(inner, value) {
    super();
    _defineProperty(this, "value", void 0);
    _defineProperty(this, "inner", void 0);
    this.value = value;
    this.inner = inner;
  }
  get is_null() {
    return this.value === null;
  }
  getType() {
    return 'Optional';
  }
  static new(inner) {
    return new OptionalField(inner, null);
  }
  createNew() {
    return OptionalField.new(this.inner.createNew());
  }
  fromBuffer(buf) {
    if (buf[0] === 0) {
      this.value = null;
      return {
        value: null,
        bytesRead: 1
      };
    }
    const parsed = this.inner.fromBuffer(buf.subarray(1));
    this.value = parsed.value;
    return {
      value: parsed.value,
      bytesRead: parsed.bytesRead + 1
    };
  }
  toBuffer() {
    if (this.is_null) {
      return Buffer.from([0]);
    }
    return Buffer.concat([Buffer.from([1]), this.inner.toBuffer()]);
  }
  fromUser(data) {
    if (data === null) {
      this.value = null;
      return this;
    }
    this.inner.fromUser(data);
    this.value = this.inner.value;
    return this;
  }
  toUser() {
    if (this.is_null) {
      return null;
    }
    return this.inner.toUser();
  }
}
exports.OptionalField = OptionalField;