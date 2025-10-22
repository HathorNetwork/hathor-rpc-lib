"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DictField = void 0;
var _base = require("./base");
var _encoding = require("./encoding");
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ /* eslint class-methods-use-this: ["error", { "exceptMethods": ["getType"] }] */ /* eslint-disable @typescript-eslint/no-explicit-any */
class DictField extends _base.NCFieldBase {
  constructor(keyField, valueField) {
    super();
    _defineProperty(this, "value", void 0);
    _defineProperty(this, "keyField", void 0);
    _defineProperty(this, "valueField", void 0);
    // Save inner fields as entries array.
    _defineProperty(this, "inner", void 0);
    this.value = undefined;
    this.keyField = keyField;
    this.valueField = valueField;
    this.inner = [];
  }
  getType() {
    return 'Dict';
  }
  static new(key, value) {
    return new DictField(key, value);
  }
  createNew() {
    return DictField.new(this.keyField.createNew(), this.valueField.createNew());
  }
  fromBuffer(buf) {
    this.inner = [];
    let bytesReadTotal = 0;
    const lenRead = _encoding.leb128.decode_unsigned(buf);
    bytesReadTotal += lenRead.bytesRead;
    const len = lenRead.value;
    const values = {};
    let dictBuf = buf.subarray(lenRead.bytesRead);
    for (let i = 0n; i < len; i++) {
      const keyF = this.keyField.createNew();
      const valueF = this.valueField.createNew();
      const key = keyF.fromBuffer(dictBuf);
      dictBuf = dictBuf.subarray(key.bytesRead);
      bytesReadTotal += key.bytesRead;
      const val = valueF.fromBuffer(dictBuf);
      dictBuf = dictBuf.subarray(val.bytesRead);
      bytesReadTotal += val.bytesRead;
      values[key.value] = val.value;
      this.inner.push([keyF, valueF]);
    }
    this.value = values;
    return {
      value: values,
      bytesRead: bytesReadTotal
    };
  }
  toBuffer() {
    const serialized = [_encoding.leb128.encode_unsigned(this.inner.length)];
    for (const el of this.inner) {
      serialized.push(el[0].toBuffer());
      serialized.push(el[1].toBuffer());
    }
    return Buffer.concat(serialized);
  }
  fromUser(data) {
    function isRecord(d) {
      return typeof d === 'object' && d !== null;
    }
    if (!isRecord(data)) {
      throw new Error('Provided data is not a valid object');
    }
    this.inner = [];
    const value = {};
    for (const [k, v] of Object.entries(data)) {
      const keyF = this.keyField.createNew();
      const valueF = this.valueField.createNew();
      const key = keyF.fromUser(k);
      const val = valueF.fromUser(v);
      value[key.value] = val.value;
      this.inner.push([keyF, valueF]);
    }
    this.value = value;
    return this;
  }
  toUser() {
    return Object.fromEntries(this.inner.map(el => [el[0].toUser(), el[1].toUser()]));
  }
}
exports.DictField = DictField;