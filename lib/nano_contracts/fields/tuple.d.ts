/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
import { BufferROExtract } from '../types';
import { NCFieldBase } from './base';
export declare class TupleField extends NCFieldBase<unknown[], unknown[]> {
    value: unknown[];
    elements: NCFieldBase[];
    constructor(elements: NCFieldBase[], value: unknown[]);
    getType(): string;
    static new(elements: NCFieldBase[]): TupleField;
    createNew(): TupleField;
    fromBuffer(buf: Buffer): BufferROExtract<unknown[]>;
    toBuffer(): Buffer;
    fromUser(data: unknown): TupleField;
    toUser(): unknown[];
}
//# sourceMappingURL=tuple.d.ts.map