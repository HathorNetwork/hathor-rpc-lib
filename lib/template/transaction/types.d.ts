/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { z } from 'zod';
import { TransactionTemplate } from './instructions';
import { TxTemplateContext } from './context';
import { IHistoryTx, ITokenBalance, ITokenData, OutputValueType } from '../../types';
import Transaction from '../../models/transaction';
import Network from '../../models/network';
import { IHathorWallet, Utxo } from '../../wallet/types';
import CreateTokenTransaction from '../../models/create_token_transaction';
export type TxInstance = Transaction | CreateTokenTransaction;
export interface IGetUtxosOptions {
    token?: string;
    authorities?: OutputValueType;
    filter_address?: string;
}
export interface IGetUtxoResponse {
    utxos: Utxo[];
    changeAmount: OutputValueType;
}
export interface IWalletBalanceData {
    token: ITokenData;
    balance: ITokenBalance;
    transactions: number;
    tokenAuthorities: {
        unlocked: {
            mint: number;
            melt: number;
        };
        locked: {
            mint: number;
            melt: number;
        };
    };
}
export interface ITxTemplateInterpreter {
    build(instructions: z.infer<typeof TransactionTemplate>, debug: boolean): Promise<TxInstance>;
    getAddress(markAsUsed?: boolean): Promise<string>;
    getAddressAtIndex(index: number): Promise<string>;
    getBalance(token: string): Promise<IWalletBalanceData>;
    getChangeAddress(ctx: TxTemplateContext): Promise<string>;
    getUtxos(amount: OutputValueType, options: IGetUtxosOptions): Promise<IGetUtxoResponse>;
    getAuthorities(count: number, options: IGetUtxosOptions): Promise<Utxo[]>;
    getTx(txId: string): Promise<IHistoryTx>;
    getNetwork(): Network;
    getWallet(): IHathorWallet;
    getHTRDeposit(mintAmount: OutputValueType): OutputValueType;
}
//# sourceMappingURL=types.d.ts.map