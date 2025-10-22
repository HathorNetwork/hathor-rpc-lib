/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import Address from '../models/address';
import Network from '../models/network';
import { IParsedArgument } from './types';
declare class NanoContractTransactionParser {
    blueprintId: string;
    method: string;
    network: Network;
    address: Address;
    args: string | null;
    parsedArgs: IParsedArgument[] | null;
    constructor(blueprintId: string, method: string, address: string, network: Network, args: string | null);
    /**
     * Parse the arguments in hex into a list of parsed arguments
     *
     * @memberof NanoContractTransactionParser
     * @inner
     */
    parseArguments(): Promise<void>;
}
export default NanoContractTransactionParser;
//# sourceMappingURL=parser.d.ts.map