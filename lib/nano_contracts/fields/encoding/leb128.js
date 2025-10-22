"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decode_signed = decode_signed;
exports.decode_unsigned = decode_unsigned;
exports.encode_signed = encode_signed;
exports.encode_unsigned = encode_unsigned;
var _leb = _interopRequireDefault(require("../../../utils/leb128"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function encode_unsigned(value, maxBytes = null) {
  return _leb.default.encodeUnsigned(value, maxBytes);
}
function decode_unsigned(value, maxBytes = null) {
  return _leb.default.decodeUnsigned(value, maxBytes);
}
function encode_signed(value, maxBytes = null) {
  return _leb.default.encodeSigned(value, maxBytes);
}
function decode_signed(value, maxBytes = null) {
  return _leb.default.decodeSigned(value, maxBytes);
}