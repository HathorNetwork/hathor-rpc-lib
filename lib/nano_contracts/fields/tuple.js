"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TupleField = void 0;
var _base = require("./base");
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ /* eslint class-methods-use-this: ["error", { "exceptMethods": ["getType"] }] */
class TupleField extends _base.NCFieldBase {
  constructor(elements, value) {
    super();
    _defineProperty(this, "value", void 0);
    _defineProperty(this, "elements", void 0);
    this.value = value;
    this.elements = elements;
  }
  getType() {
    return 'Tuple';
  }
  static new(elements) {
    return new TupleField(elements, []);
  }
  createNew() {
    return TupleField.new(this.elements.map(el => el.createNew()));
  }
  fromBuffer(buf) {
    const values = [];
    let bytesReadTotal = 0;
    let tupleBuf = buf.subarray();
    for (const el of this.elements) {
      const result = el.fromBuffer(tupleBuf);
      values.push(result.value);
      bytesReadTotal += result.bytesRead;
      tupleBuf = tupleBuf.subarray(result.bytesRead);
    }
    this.value = values;
    return {
      value: values,
      bytesRead: bytesReadTotal
    };
  }
  toBuffer() {
    const serialized = [];
    for (const el of this.elements) {
      serialized.push(el.toBuffer());
    }
    return Buffer.concat(serialized);
  }
  fromUser(data) {
    function isArray(d) {
      return typeof d === 'object' && d != null && Array.isArray(d);
    }
    if (!isArray(data)) {
      throw new Error('Provided data is not iterable, so it cannot be a list.');
    }
    const values = [];
    if (this.elements.length !== data.length) {
      throw new Error('Mismatched number of values from type');
    }
    for (const [index, el] of this.elements.entries()) {
      el.fromUser(data[index]);
      values.push(el.value);
    }
    this.value = values;
    return this;
  }
  toUser() {
    return this.elements.map(el => el.toUser());
  }
}
exports.TupleField = TupleField;