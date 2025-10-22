/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
import { IHistoryOutputDecoded } from '../types';
declare class ScriptData {
    data: string;
    constructor(data: string);
    /**
     * Get script type
     *
     * @return {String}
     * @memberof ScriptData
     * @inner
     */
    getType(): string;
    /**
     * Build the original decoded script
     */
    toData(): IHistoryOutputDecoded;
    /**
     * Create an output script from data
     *
     * @return {Buffer}
     * @memberof ScriptData
     * @inner
     */
    createScript(): Buffer;
}
export default ScriptData;
//# sourceMappingURL=script_data.d.ts.map