/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { VertexHeaderId } from './types';
import { HeaderStaticType } from './base';
export default class HeaderParser {
    static getSupportedHeaders(): Record<VertexHeaderId, HeaderStaticType>;
    static getHeader(id: string): HeaderStaticType;
}
//# sourceMappingURL=parser.d.ts.map