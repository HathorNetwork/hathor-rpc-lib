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
export interface ISignedData {
    type: string;
    signature: Buffer;
    value: unknown;
}
export interface IUserSignedData {
    type: string;
    signature: string;
    value: unknown;
}
/**
 * A schema to validate that the user sent unknown data is a valid IUserSignedData.
 */
export declare const UserSignedDataSchema: z.ZodType<IUserSignedData, z.ZodTypeDef, unknown>;
export declare class SignedDataField extends NCFieldBase<IUserSignedData, ISignedData> {
    value: ISignedData;
    inner: NCFieldBase;
    constructor(inner: NCFieldBase, type: string, signature: Buffer, value: unknown);
    getType(): string;
    static new(inner: NCFieldBase, type: string): SignedDataField;
    createNew(): SignedDataField;
    fromBuffer(buf: Buffer): BufferROExtract<ISignedData>;
    toBuffer(): Buffer;
    fromUser(data: unknown): SignedDataField;
    toUser(): IUserSignedData;
}
//# sourceMappingURL=signedData.d.ts.map