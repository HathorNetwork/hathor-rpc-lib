/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
import { BufferROExtract } from '../types';
import { NCFieldBase } from './base';
export declare class OptionalField extends NCFieldBase<unknown | null, unknown | null> {
    value: unknown | null;
    inner: NCFieldBase;
    constructor(inner: NCFieldBase, value: unknown | null);
    get is_null(): boolean;
    getType(): string;
    static new(inner: NCFieldBase): OptionalField;
    createNew(): OptionalField;
    fromBuffer(buf: Buffer): BufferROExtract<unknown | null>;
    toBuffer(): Buffer;
    fromUser(data: unknown): OptionalField;
    toUser(): unknown | null;
}
//# sourceMappingURL=optional.d.ts.map