"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NCFieldBase = void 0;
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

class NCFieldBase {
  constructor() {
    _defineProperty(this, "value", void 0);
  }
  /**
   * Read an instance of the field from a buffer
   */
  /**
   * Serialize field value into a buffer
   */
  /**
   * Parse field from user value.
   */
  /**
   * Show the value as user readable.
   */
  /**
   * Get an identifier for the field class.
   * This may not be the same as the field type since
   * some types use the same field, e.g. bytes, TxOutputScript are both BytesField.
   */
  /**
   * Create a new empty instance.
   */
}
exports.NCFieldBase = NCFieldBase;