/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
import { NanoContractActionHeader } from './types';
import type Transaction from '../models/transaction';
import Header from '../headers/base';
import Address from '../models/address';
import Network from '../models/network';
declare class NanoContractHeader extends Header {
    id: string;
    method: string;
    args: Buffer;
    actions: NanoContractActionHeader[];
    address: Address;
    seqnum: number;
    /**
     * script with signature(s) of the transaction owner(s)/caller(s).
     * Supports P2PKH and P2SH
     */
    script: Buffer | null;
    constructor(id: string, method: string, args: Buffer, actions: NanoContractActionHeader[], seqnum: number, address: Address, script?: Buffer | null);
    /**
     * Serialize funds fields
     * Add the serialized fields to the array parameter
     *
     * @param array Array of buffer to push the serialized fields
     * @param addScript If should add the script with the signature(s) when serializing it
     *
     * @memberof NanoContract
     * @inner
     */
    serializeFields(array: Buffer[], addScript: boolean): void;
    /**
     * Serialize sighash data to bytes
     *
     * @memberof NanoContractHeader
     * @inner
     */
    serializeSighash(array: Buffer[]): void;
    /**
     * Serialize header to bytes
     *
     * @memberof NanoContractHeader
     * @inner
     */
    serialize(array: Buffer[]): void;
    /**
     * Deserialize buffer to Header object and
     * return the rest of the buffer data
     *
     * @return Header object deserialized and the rest of buffer data
     *
     * @memberof NanoContractHeader
     * @inner
     */
    static deserialize(srcBuf: Buffer, network: Network): [Header, Buffer];
    /**
     * Get the nano contract header from the list of headers.
     *
     * @return The nano header object
     *
     * @memberof Transaction
     * @inner
     */
    static getHeadersFromTx(tx: Transaction): NanoContractHeader[];
}
export default NanoContractHeader;
//# sourceMappingURL=header.d.ts.map