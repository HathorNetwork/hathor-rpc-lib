/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { z } from 'zod';
import { TransactionTemplate, NanoAction } from './instructions';
import { TxTemplateContext, NanoContractContext } from './context';
import { ITxTemplateInterpreter, IGetUtxosOptions, IGetUtxoResponse, IWalletBalanceData, TxInstance } from './types';
import { IHistoryTx, OutputValueType } from '../../types';
import { IHathorWallet, Utxo } from '../../wallet/types';
import HathorWallet from '../../new/wallet';
import Network from '../../models/network';
import NanoContractHeader from '../../nano_contracts/header';
import { NanoContractActionHeader } from '../../nano_contracts/types';
export declare class WalletTxTemplateInterpreter implements ITxTemplateInterpreter {
    wallet: HathorWallet;
    txCache: Record<string, IHistoryTx>;
    constructor(wallet: HathorWallet);
    getBlueprintId(nanoCtx: NanoContractContext): Promise<string>;
    static mapActionInstructionToAction(ctx: TxTemplateContext, action: z.output<typeof NanoAction>): NanoContractActionHeader;
    buildNanoHeader(ctx: TxTemplateContext): Promise<NanoContractHeader>;
    build(instructions: z.infer<typeof TransactionTemplate>, debug?: boolean): Promise<TxInstance>;
    buildAndSign(instructions: z.infer<typeof TransactionTemplate>, pinCode: string, debug?: boolean): Promise<TxInstance>;
    getAddress(markAsUsed?: boolean): Promise<string>;
    getAddressAtIndex(index: number): Promise<string>;
    getBalance(token: string): Promise<IWalletBalanceData>;
    /**
     * XXX: maybe we can save the change address chosen on the context.
     * This way the same change address would be used throughout the transaction
     */
    getChangeAddress(_ctx: TxTemplateContext): Promise<any>;
    getUtxos(amount: OutputValueType, options: IGetUtxosOptions): Promise<IGetUtxoResponse>;
    getAuthorities(count: number, options: IGetUtxosOptions): Promise<Utxo[]>;
    getTx(txId: string): Promise<IHistoryTx>;
    getNetwork(): Network;
    getWallet(): IHathorWallet;
    getHTRDeposit(mintAmount: OutputValueType): OutputValueType;
}
//# sourceMappingURL=interpreter.d.ts.map