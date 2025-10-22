/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
/**
 * The hathor-core has a similar enum that maps to bytes.
 * In typescript this is not easy to manipulate so I decided
 * to have the same enum but with hex values instead.
 */
export declare const enum VertexHeaderId {
    NANO_HEADER = "10"
}
export declare function getVertexHeaderIdBuffer(id: VertexHeaderId): Buffer;
export declare function getVertexHeaderIdFromBuffer(buf: Buffer): VertexHeaderId;
//# sourceMappingURL=types.d.ts.map