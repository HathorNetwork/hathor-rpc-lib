"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TimestampField = void 0;
var _zod = require("zod");
var _base = require("./base");
var _buffer = require("../../utils/buffer");
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ /* eslint class-methods-use-this: ["error", { "exceptMethods": ["getType", "createNew"] }] */
class TimestampField extends _base.NCFieldBase {
  constructor(value) {
    super();
    _defineProperty(this, "value", void 0);
    this.value = value;
  }
  getType() {
    return 'Timestamp';
  }
  static new() {
    return new TimestampField(0);
  }
  createNew() {
    return TimestampField.new();
  }
  fromBuffer(buf) {
    const value = (0, _buffer.unpackToInt)(4, true, buf)[0];
    this.value = value;
    return {
      value,
      bytesRead: 4
    };
  }
  toBuffer() {
    return (0, _buffer.signedIntToBytes)(this.value, 4);
  }
  fromUser(data) {
    const value = _zod.z.number().parse(data);
    this.value = value;
    return this;
  }
  toUser() {
    return this.value;
  }
}
exports.TimestampField = TimestampField;