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

function encode(value) {
  return Buffer.from([value ? 1 : 0]);
}
function decode(buf) {
  switch (buf[0]) {
    case 0:
      return {
        value: false,
        bytesRead: 1
      };
    case 1:
      return {
        value: true,
        bytesRead: 1
      };
    default:
      throw new Error('Invalid boolean tag');
  }
}