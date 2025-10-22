/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
import { BufferROExtract } from '../types';
import { NCFieldBase } from './base';
export declare class CollectionField extends NCFieldBase<unknown[], unknown[]> {
    value: unknown[];
    kind: NCFieldBase;
    inner: NCFieldBase[];
    constructor(kind: NCFieldBase);
    getType(): string;
    static new(kind: NCFieldBase): CollectionField;
    createNew(): CollectionField;
    fromBuffer(buf: Buffer): BufferROExtract<unknown[]>;
    toBuffer(): Buffer;
    fromUser(data: unknown): CollectionField;
    toUser(): unknown[];
}
//# sourceMappingURL=collection.d.ts.map