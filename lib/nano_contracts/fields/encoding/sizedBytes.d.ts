/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
import { BufferROExtract } from '../../types';
export declare function encode(len: number, buf: Buffer): Buffer;
export declare function decode(len: number, buf: Buffer): BufferROExtract<Buffer>;
//# sourceMappingURL=sizedBytes.d.ts.map