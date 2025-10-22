"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Bytes32Field = void 0;
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
class Bytes32Field extends _base.NCFieldBase {
  constructor(value) {
    super();
    _defineProperty(this, "value", void 0);
    this.value = value;
  }
  getType() {
    return 'bytes32';
  }
  static new() {
    return new Bytes32Field(Buffer.alloc(0));
  }
  createNew() {
    return Bytes32Field.new();
  }
  fromBuffer(buf) {
    const parsed = _encoding.sizedBytes.decode(32, buf);
    this.value = parsed.value;
    return parsed;
  }
  toBuffer() {
    return _encoding.sizedBytes.encode(32, this.value);
  }
  fromUser(data) {
    const value = _zod.z.string().regex(/^[a-fA-F0-9]{64}$/).parse(data);
    this.value = Buffer.from(value, 'hex');
    return this;
  }
  toUser() {
    return this.value.toString('hex');
  }
}
exports.Bytes32Field = Bytes32Field;