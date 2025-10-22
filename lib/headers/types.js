"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.VertexHeaderId = void 0;
exports.getVertexHeaderIdBuffer = getVertexHeaderIdBuffer;
exports.getVertexHeaderIdFromBuffer = getVertexHeaderIdFromBuffer;
/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/**
 * The hathor-core has a similar enum that maps to bytes.
 * In typescript this is not easy to manipulate so I decided
 * to have the same enum but with hex values instead.
 */
let VertexHeaderId = exports.VertexHeaderId = /*#__PURE__*/function (VertexHeaderId) {
  VertexHeaderId["NANO_HEADER"] = "10";
  return VertexHeaderId;
}({});
function getVertexHeaderIdBuffer(id) {
  return Buffer.from(id, 'hex');
}
function getVertexHeaderIdFromBuffer(buf) {
  const vertexId = buf.readUInt8().toString(16);
  switch (vertexId) {
    case VertexHeaderId.NANO_HEADER:
      return VertexHeaderId.NANO_HEADER;
    default:
      throw new Error('Invalid VertexHeaderId');
  }
}