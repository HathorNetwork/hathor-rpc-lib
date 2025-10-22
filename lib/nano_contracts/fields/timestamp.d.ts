/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
import { BufferROExtract } from '../types';
import { NCFieldBase } from './base';
export declare class TimestampField extends NCFieldBase<number, number> {
    value: number;
    constructor(value: number);
    getType(): string;
    static new(): TimestampField;
    createNew(): TimestampField;
    fromBuffer(buf: Buffer): BufferROExtract<number>;
    toBuffer(): Buffer;
    fromUser(data: unknown): TimestampField;
    toUser(): number;
}
//# sourceMappingURL=timestamp.d.ts.map