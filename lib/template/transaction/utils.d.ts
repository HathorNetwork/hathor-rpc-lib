/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { OutputValueType } from '../../types';
import { TxTemplateContext } from './context';
import { ITxTemplateInterpreter, IGetUtxosOptions } from './types';
/**
 * Select tokens from interpreter and modify context as required by the tokens found.
 */
export declare function selectTokens(interpreter: ITxTemplateInterpreter, ctx: TxTemplateContext, amount: OutputValueType, options: IGetUtxosOptions, autoChange: boolean, changeAddress: string, position?: number): Promise<void>;
/**
 * Select authorities from interpreter and modify context as required by the selection.
 */
export declare function selectAuthorities(interpreter: ITxTemplateInterpreter, ctx: TxTemplateContext, options: IGetUtxosOptions, count?: number, position?: number): Promise<void>;
//# sourceMappingURL=utils.d.ts.map