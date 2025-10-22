/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
import { NanoContractArgumentSingleType, NanoContractArgumentType, NanoContractParsedArgument, BufferROExtract, NanoContractArgumentApiInputType, NanoContractArgumentTypeName, NanoContractArgumentSingleTypeName } from './types';
import Serializer from './serializer';
import Deserializer from './deserializer';
export declare class NanoContractMethodArgument {
    name: string;
    type: NanoContractArgumentTypeName;
    value: NanoContractArgumentType;
    _serialized: Buffer;
    constructor(name: string, type: string, value: NanoContractArgumentType);
    /**
     * Serialize the argument into bytes
     */
    serialize(serializer: Serializer): Buffer;
    /**
     * Deserialize value from buffer and create an instance of NanoContractMethodArgument
     */
    static fromSerialized(name: string, type: string, buf: Buffer, deserializer: Deserializer): BufferROExtract<NanoContractMethodArgument>;
    /**
     * User input and api serialized input may not be encoded in the actual value type.
     *
     * ## SignedData and RawSignedData
     * We expect the value as a string separated by comma (,) with 3 elements
     * (signature, value, type)
     * Since the value is encoded as a string some special cases apply:
     * - bool: 'true' or 'false'.
     * - bytes (and any bytes encoded value): hex encoded string of the byte value.
     *
     * While the value should be the NanoContractSignedDataSchema
     */
    static fromApiInput(name: string, type: string, value: NanoContractArgumentApiInputType): NanoContractMethodArgument;
    /**
     * This is a helper method, so we can create the api input representation of the arg value.
     */
    toApiInput(): NanoContractParsedArgument;
    /**
     * Prepare value for ApiInput, converting single types to NanoContractArgumentApiInputType
     */
    static prepSingleValue(value: NanoContractArgumentSingleType, type: NanoContractArgumentSingleTypeName): NanoContractArgumentApiInputType;
    /**
     * Prepare value for ApiInput, converting any type to NanoContractArgumentApiInputType
     * Works for container values, converting the inner value as well if needed
     */
    static prepValue(value: NanoContractArgumentType, type: NanoContractArgumentTypeName): NanoContractArgumentApiInputType;
}
//# sourceMappingURL=methodArg.d.ts.map