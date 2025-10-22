/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
import Network from '../models/network';
export interface HeaderStaticType {
    deserialize(srcBuf: Buffer, network: Network): [Header, Buffer];
}
export default abstract class Header {
    abstract serialize(array: Buffer[]): void;
    abstract serializeSighash(array: Buffer[]): void;
    static deserialize(srcBuf: Buffer, network: Network): [Header, Buffer];
}
//# sourceMappingURL=base.d.ts.map