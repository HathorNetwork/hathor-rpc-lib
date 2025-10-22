"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BoolField = void 0;
var _zod = require("zod");
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
class BoolField extends _base.NCFieldBase {
  constructor(value) {
    super();
    _defineProperty(this, "value", void 0);
    this.value = value;
  }
  getType() {
    return 'bool';
  }
  static new() {
    return new BoolField(false);
  }
  createNew() {
    return BoolField.new();
  }
  fromBuffer(buf) {
    if (buf.length === 0) {
      throw new Error('No data left to read');
    }
    const result = _encoding.bool.decode(buf);
    this.value = result.value;
    return result;
  }
  toBuffer() {
    return _encoding.bool.encode(this.value);
  }
  fromUser(data) {
    const value = _zod.z.boolean().or(_zod.z.union([_zod.z.literal('true'), _zod.z.literal('false')]).transform(val => val === 'true')).parse(data);
    this.value = value;
    return this;
  }
  toUser() {
    return this.value ? 'true' : 'false';
  }
}
exports.BoolField = BoolField;