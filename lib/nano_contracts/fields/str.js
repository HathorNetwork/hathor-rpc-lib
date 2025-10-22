"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StrField = void 0;
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
class StrField extends _base.NCFieldBase {
  constructor(value) {
    super();
    _defineProperty(this, "value", void 0);
    this.value = value;
  }
  getType() {
    return 'str';
  }
  static new() {
    return new StrField('');
  }
  createNew() {
    return StrField.new();
  }
  fromBuffer(buf) {
    const parsed = _encoding.utf8.decode(buf);
    this.value = parsed.value;
    return parsed;
  }
  toBuffer() {
    return _encoding.utf8.encode(this.value);
  }
  fromUser(data) {
    this.value = _zod.z.string().parse(data);
    return this;
  }
  toUser() {
    return this.value;
  }
}
exports.StrField = StrField;