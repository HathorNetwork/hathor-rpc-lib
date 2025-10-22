"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decode = decode;
exports.encode = encode;
/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function encode(len, buf) {
  return Buffer.from(buf.subarray(0, len));
}
function decode(len, buf) {
  if (buf.length < len) {
    throw new Error('Do not have enough bytes to read the expected length');
  }
  return {
    value: buf.subarray(0, len),
    bytesRead: len
  };
}