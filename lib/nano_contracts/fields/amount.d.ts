/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
import { BufferROExtract } from '../types';
import { NCFieldBase } from './base';
export declare class AmountField extends NCFieldBase<number | bigint | string, bigint> {
    value: bigint;
    constructor(value: bigint);
    getType(): string;
    static new(): AmountField;
    createNew(): AmountField;
    fromBuffer(buf: Buffer): BufferROExtract<bigint>;
    toBuffer(): Buffer;
    fromUser(data: unknown): AmountField;
    toUser(): string;
}
//# sourceMappingURL=amount.d.ts.map