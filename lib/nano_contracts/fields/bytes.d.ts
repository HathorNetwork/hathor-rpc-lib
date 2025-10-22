/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
import { BufferROExtract } from '../types';
import { NCFieldBase } from './base';
export declare class BytesField extends NCFieldBase<string, Buffer> {
    value: Buffer;
    constructor(value: Buffer);
    getType(): string;
    static new(): BytesField;
    createNew(): BytesField;
    fromBuffer(buf: Buffer): BufferROExtract<Buffer>;
    toBuffer(): Buffer;
    fromUser(data: unknown): BytesField;
    toUser(): string;
}
//# sourceMappingURL=bytes.d.ts.map