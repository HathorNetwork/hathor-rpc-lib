"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _types = require("./types");
var _header = _interopRequireDefault(require("../nano_contracts/header"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

class HeaderParser {
  static getSupportedHeaders() {
    return {
      [_types.VertexHeaderId.NANO_HEADER]: _header.default
    };
  }
  static getHeader(id) {
    const headers = HeaderParser.getSupportedHeaders();
    if (!(id in headers)) {
      throw new Error(`Header id not supported: ${id}`);
    }
    return headers[id];
  }
}
exports.default = HeaderParser;