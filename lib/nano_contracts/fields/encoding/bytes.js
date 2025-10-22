"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decode = decode;
exports.encode = encode;
var _constants = require("../../../constants");
var leb128 = _interopRequireWildcard(require("./leb128"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function encode(buf) {
  return Buffer.concat([leb128.encode_unsigned(buf.length), Buffer.from(buf)]);
}
function decode(buf) {
  // INFO: maxBytes is set to 3 because the max allowed length in bytes for a string is
  // NC_ARGS_MAX_BYTES_LENGTH which is encoded as 3 bytes in leb128 unsigned.
  // If we read a fourth byte we are definetely reading a higher number than allowed.
  const {
    value: lengthBN,
    bytesRead: bytesReadForLength
  } = leb128.decode_unsigned(buf, 3);
  const rest = buf.subarray(bytesReadForLength);
  if (lengthBN > BigInt(_constants.NC_ARGS_MAX_BYTES_LENGTH)) {
    throw new Error('length in bytes is higher than max allowed');
  }
  // If lengthBN is lower than 64 KiB than its safe to convert to Number
  const length = Number(lengthBN);
  if (rest.length < length) {
    throw new Error('Do not have enough bytes to read the expected length');
  }
  return {
    value: rest.subarray(0, length),
    bytesRead: length + bytesReadForLength
  };
}