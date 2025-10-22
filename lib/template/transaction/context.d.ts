/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { z } from 'zod';
import { IHistoryTx, ILogger, OutputValueType } from '../../types';
import Input from '../../models/input';
import Output from '../../models/output';
import { NanoAction } from './instructions';
export interface TokenBalance {
    tokens: OutputValueType;
    mint_authorities: number;
    melt_authorities: number;
}
export declare class TxBalance {
    balance: Record<string, TokenBalance>;
    createdTokenBalance: null | TokenBalance;
    constructor();
    /**
     * Get the current balance of the given token.
     */
    getTokenBalance(token: string): TokenBalance;
    /**
     * Get the current balance of the token being created.
     * Obs: only valid for create token transactions.
     */
    getCreatedTokenBalance(): TokenBalance;
    /**
     * Set the balance of a token.
     */
    setTokenBalance(token: string, balance: TokenBalance): void;
    /**
     * Set the balance of the created token.
     */
    setCreatedTokenBalance(balance: TokenBalance): void;
    /**
     * Add balance from utxo of the given transaction.
     */
    addBalanceFromUtxo(tx: IHistoryTx, index: number): void;
    /**
     * Remove the balance given from the token balance.
     */
    addOutput(amount: OutputValueType, token: string): void;
    /**
     * Remove the balance from the token being created.
     */
    addCreatedTokenOutput(amount: OutputValueType): void;
    /**
     * Remove the specified authority from the balance of the given token.
     */
    addOutputAuthority(count: number, token: string, authority: 'mint' | 'melt'): void;
    /**
     * Remove the authority from the balance of the token being created.
     */
    addCreatedTokenOutputAuthority(count: number, authority: 'mint' | 'melt'): void;
}
export declare class NanoContractContext {
    id: string;
    method: string;
    caller: string;
    args: unknown[];
    actions: z.output<typeof NanoAction>[];
    constructor(id: string, method: string, caller: string, args: unknown[], actions: z.output<typeof NanoAction>[]);
}
export declare class TxTemplateContext {
    version: number;
    signalBits: number;
    inputs: Input[];
    outputs: Output[];
    tokens: string[];
    balance: TxBalance;
    tokenName?: string;
    tokenSymbol?: string;
    nanoContext?: NanoContractContext;
    vars: Record<string, unknown>;
    _logs: string[];
    _logger: ILogger;
    debug: boolean;
    constructor(logger?: ILogger, debug?: boolean);
    /**
     * Add the line to the log array.
     * Optionally use the logger to show the logs as they are being created.
     */
    log(message: string): void;
    get logArray(): string[];
    /**
     * Change the current tx
     */
    useCreateTokenTxContext(): void;
    isCreateTokenTxContext(): boolean;
    startNanoContractExecution(id: string, method: string, caller: string, args: unknown[], actions: z.output<typeof NanoAction>[]): void;
    isNanoMethodExecution(): boolean;
    /**
     * Add a token to the transaction and return its token_data.
     * The token array order will be preserved so the token_data is final.
     *
     * If the transaction is a CREATE_TOKEN_TX it does not have a token array,
     * only HTR (token_data=0) and the created token(token_data=1)
     *
     * @param token Token UID.
     * @returns token_data for the requested token.
     */
    addToken(token: string): number;
    /**
     * Add inputs to the context.
     */
    addInputs(position: number, ...inputs: Input[]): void;
    /**
     * Add outputs to the context.
     */
    addOutputs(position: number, ...outputs: Output[]): void;
}
//# sourceMappingURL=context.d.ts.map