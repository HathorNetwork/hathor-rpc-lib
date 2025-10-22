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
import Address from '../../models/address';
import Network from '../../models/network';
export declare const AddressSchema: z.ZodString;
export declare class AddressField extends NCFieldBase<string, Address> {
    value: Address | null;
    network: Network;
    constructor(network: Network, value?: Address | null);
    getType(): string;
    /**
     * Create an instance of AddressField, may be empty to allow reading from other sources.
     * @example
     * ```ts
     * const testnet = new Network('testnet');
     * const buf = Buffer.from('4969ffb1549f2e00f30bfc0cf0b9207ed96f7f33ba578d4852', 'hex');
     *
     * const field = AddressField.new(testnet);
     * const parseData = field.fromBuffer(buf);
     * const fieldFromUser = AddressField.new(testnet).fromUser('WYLW8ujPemSuLJwbeNvvH6y7nakaJ6cEwT');
     * ```
     */
    static new(network: Network): AddressField;
    createNew(): AddressField;
    fromBuffer(buf: Buffer): BufferROExtract<Address>;
    toBuffer(): Buffer;
    fromUser(data: unknown): AddressField;
    toUser(): string;
}
//# sourceMappingURL=address.d.ts.map