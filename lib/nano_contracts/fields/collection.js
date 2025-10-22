"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CollectionField = void 0;
var _base = require("./base");
var _encoding = require("./encoding");
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ /* eslint class-methods-use-this: ["error", { "exceptMethods": ["getType"] }] */
class CollectionField extends _base.NCFieldBase {
  constructor(kind) {
    super();
    _defineProperty(this, "value", void 0);
    _defineProperty(this, "kind", void 0);
    _defineProperty(this, "inner", void 0);
    this.kind = kind;
    this.value = [];
    this.inner = [];
  }
  getType() {
    return 'Collection';
  }
  static new(kind) {
    return new CollectionField(kind);
  }
  createNew() {
    return CollectionField.new(this.kind.createNew());
  }
  fromBuffer(buf) {
    const values = [];
    let bytesReadTotal = 0;
    const lenRead = _encoding.leb128.decode_unsigned(buf);
    const len = lenRead.value;
    let listBuf = buf.subarray(lenRead.bytesRead);
    for (let i = 0n; i < len; i++) {
      const field = this.kind.createNew();
      const result = field.fromBuffer(listBuf);
      values.push(result.value);
      bytesReadTotal += result.bytesRead;
      listBuf = listBuf.subarray(result.bytesRead);
      this.inner.push(field);
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
      serialized.push(el.toBuffer());
    }
    return Buffer.concat(serialized);
  }
  fromUser(data) {
    function isIterable(d) {
      return d != null && typeof d[Symbol.iterator] === 'function';
    }
    if (!isIterable(data)) {
      throw new Error('Provided data is not iterable, so it cannot be a list.');
    }
    const values = [];
    for (const el of data) {
      const field = this.kind.createNew();
      field.fromUser(el);
      values.push(field.value);
      this.inner.push(field);
    }
    this.value = values;
    return this;
  }
  toUser() {
    return this.inner.map(el => el.toUser());
  }
}
exports.CollectionField = CollectionField;