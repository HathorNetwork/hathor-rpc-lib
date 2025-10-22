/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
export interface Leb128DecodeResult {
    value: bigint;
    rest: Buffer;
    bytesRead: number;
}
/**
 * Encode a number into a leb128 encoded buffer.
 * @param value The actual value to encode.
 * @param [signed=true] Differentiate signed and unsigned encoded numbers.
 * @param [maxBytes=null] Max allowed size of the output buffer.
 */
export declare function encodeLeb128(value: bigint | number, signed?: boolean, maxBytes?: number | null): Buffer;
/**
 * Decode a leb128 buffer into a number if possible.
 * @param buf The buffer with the actual data.
 * @param [signed=true] Differentiate signed and unsigned encoded numbers.
 * @param [maxBytes=null] Max allowed size of the output buffer.
 */
export declare function decodeLeb128(buf: Buffer, signed?: boolean, maxBytes?: number | null): Leb128DecodeResult;
/**
 * Encode signed leb128 number
 */
export declare function encodeSigned(value: bigint | number, maxBytes?: number | null): Buffer;
/**
 * Decode signed leb128 number
 */
export declare function decodeSigned(buf: Buffer, maxBytes?: number | null): Leb128DecodeResult;
/**
 * Encode unsigned leb128 number
 */
export declare function encodeUnsigned(value: bigint | number, maxBytes?: number | null): Buffer;
/**
 * Decode unsigned leb128 number
 */
export declare function decodeUnsigned(buf: Buffer, maxBytes?: number | null): Leb128DecodeResult;
declare const _default: {
    encodeLeb128: typeof encodeLeb128;
    decodeLeb128: typeof decodeLeb128;
    encodeSigned: typeof encodeSigned;
    decodeSigned: typeof decodeSigned;
    encodeUnsigned: typeof encodeUnsigned;
    decodeUnsigned: typeof decodeUnsigned;
};
export default _default;
//# sourceMappingURL=leb128.d.ts.map