/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
import { z } from 'zod';
import { BufferROExtract } from '../types';
import { NCFieldBase } from './base';
export declare class IntField extends NCFieldBase<number | bigint | string, bigint> {
    value: bigint;
    schema: z.ZodBigInt;
    constructor(value: bigint);
    getType(): string;
    static new(): IntField;
    createNew(): IntField;
    fromBuffer(buf: Buffer): BufferROExtract<bigint>;
    toBuffer(): Buffer;
    fromUser(data: unknown): IntField;
    toUser(): string;
}
//# sourceMappingURL=int.d.ts.map