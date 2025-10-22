/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
import { BufferROExtract } from '../types';
import { NCFieldBase } from './base';
export declare class BoolField extends NCFieldBase<boolean | string, boolean> {
    value: boolean;
    constructor(value: boolean);
    getType(): string;
    static new(): BoolField;
    createNew(): BoolField;
    fromBuffer(buf: Buffer): BufferROExtract<boolean>;
    toBuffer(): Buffer;
    fromUser(data: unknown): BoolField;
    toUser(): 'true' | 'false';
}
//# sourceMappingURL=bool.d.ts.map