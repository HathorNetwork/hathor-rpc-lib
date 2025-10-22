/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
import { BufferROExtract } from '../types';
import { NCFieldBase } from './base';
export declare class TokenUidField extends NCFieldBase<string, string> {
    value: string;
    constructor(value: string);
    getType(): string;
    static new(): TokenUidField;
    createNew(): TokenUidField;
    fromBuffer(buf: Buffer): BufferROExtract<string>;
    toBuffer(): Buffer;
    fromUser(data: unknown): TokenUidField;
    toUser(): string;
}
//# sourceMappingURL=token.d.ts.map