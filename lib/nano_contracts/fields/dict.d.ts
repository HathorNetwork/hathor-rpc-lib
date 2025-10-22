/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
import { BufferROExtract } from '../types';
import { NCFieldBase } from './base';
export declare class DictField extends NCFieldBase<Record<any, unknown>, Record<any, unknown>> {
    value: unknown;
    keyField: NCFieldBase;
    valueField: NCFieldBase;
    inner: [NCFieldBase, NCFieldBase][];
    constructor(keyField: NCFieldBase, valueField: NCFieldBase);
    getType(): string;
    static new(key: NCFieldBase, value: NCFieldBase): DictField;
    createNew(): DictField;
    fromBuffer(buf: Buffer): BufferROExtract<Record<any, unknown>>;
    toBuffer(): Buffer;
    fromUser(data: unknown): DictField;
    toUser(): Record<any, unknown>;
}
//# sourceMappingURL=dict.d.ts.map