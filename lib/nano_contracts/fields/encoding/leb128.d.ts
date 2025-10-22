/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
import { BufferROExtract } from '../../types';
export declare function encode_unsigned(value: bigint | number, maxBytes?: number | null): Buffer;
export declare function decode_unsigned(value: Buffer, maxBytes?: number | null): BufferROExtract<bigint>;
export declare function encode_signed(value: bigint | number, maxBytes?: number | null): Buffer;
export declare function decode_signed(value: Buffer, maxBytes?: number | null): BufferROExtract<bigint>;
//# sourceMappingURL=leb128.d.ts.map