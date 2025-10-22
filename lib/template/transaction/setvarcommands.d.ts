/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { z } from 'zod';
import { ITxTemplateInterpreter } from './types';
import { TxTemplateContext } from './context';
import { SetVarGetOracleScriptOpts, SetVarGetOracleSignedDataOpts, SetVarGetWalletAddressOpts, SetVarGetWalletBalanceOpts } from './instructions';
import { IUserSignedData } from '../../nano_contracts/fields/signedData';
export declare function getWalletAddress(interpreter: ITxTemplateInterpreter, _ctx: TxTemplateContext, options: z.infer<typeof SetVarGetWalletAddressOpts>): Promise<string>;
export declare function getWalletBalance(interpreter: ITxTemplateInterpreter, _ctx: TxTemplateContext, options: z.infer<typeof SetVarGetWalletBalanceOpts>): Promise<number | bigint>;
export declare function getOracleScript(interpreter: ITxTemplateInterpreter, _ctx: TxTemplateContext, options: z.infer<typeof SetVarGetOracleScriptOpts>): Promise<string>;
export declare function getOracleSignedData(interpreter: ITxTemplateInterpreter, _ctx: TxTemplateContext, options: z.infer<typeof SetVarGetOracleSignedDataOpts>): Promise<IUserSignedData>;
//# sourceMappingURL=setvarcommands.d.ts.map