/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
import Transaction from '../models/transaction';
import CreateTokenTransaction from '../models/create_token_transaction';
import HathorWallet from '../new/wallet';
import { NanoContractAction, NanoContractBuilderCreateTokenOptions, NanoContractVertexType, IArgumentField } from './types';
import { IDataInput, IDataOutput } from '../types';
import Address from '../models/address';
declare class NanoContractTransactionBuilder {
    blueprintId: string | null | undefined;
    ncId: string | null | undefined;
    method: string | null;
    actions: NanoContractAction[] | null;
    caller: Address | null;
    args: unknown[] | null;
    parsedArgs: IArgumentField[] | null;
    serializedArgs: Buffer | null;
    wallet: HathorWallet | null;
    vertexType: NanoContractVertexType | null;
    createTokenOptions: NanoContractBuilderCreateTokenOptions | null;
    tokenFeeAddedInDeposit: boolean;
    constructor();
    /**
     * Set object method attribute
     *
     * @param method Method name
     *
     * @memberof NanoContractTransactionBuilder
     * @inner
     */
    setMethod(method: string): this;
    /**
     * Set object actions attribute
     *
     * @param actions List of actions
     *
     * @memberof NanoContractTransactionBuilder
     * @inner
     */
    setActions(actions: NanoContractAction[] | null | undefined): this;
    /**
     * Set object args attribute
     *
     * @param args List of arguments
     *
     * @memberof NanoContractTransactionBuilder
     * @inner
     */
    setArgs(args: unknown[] | null): this;
    /**
     * Set object caller attribute
     *
     * @param caller Caller address
     *
     * @memberof NanoContractTransactionBuilder
     * @inner
     */
    setCaller(caller: Address): this;
    /**
     * Set object blueprintId attribute
     *
     * @param blueprintId Blueprint id
     *
     * @memberof NanoContractTransactionBuilder
     * @inner
     */
    setBlueprintId(blueprintId: string): this;
    /**
     * Set object ncId attribute
     *
     * @param {ncId} Nano contract id
     *
     * @memberof NanoContractTransactionBuilder
     * @inner
     */
    setNcId(ncId: string): this;
    /**
     * Set object wallet attribute
     *
     * @param {wallet} Wallet object building this transaction
     *
     * @memberof NanoContractTransactionBuilder
     * @inner
     */
    setWallet(wallet: HathorWallet): this;
    /**
     * Set vertex type
     *
     * @param {vertexType} The vertex type
     * @param {createTokenOptions} Options for the token creation tx
     *
     * @memberof NanoContractTransactionBuilder
     * @inner
     */
    setVertexType(vertexType: NanoContractVertexType, createTokenOptions?: NanoContractBuilderCreateTokenOptions | null): this;
    /**
     * Execute a deposit action
     * Create inputs (and maybe change outputs) to complete the deposit
     *
     * @param {action} Action to be completed (must be a deposit type)
     *
     * @memberof NanoContractTransactionBuilder
     * @inner
     */
    executeDeposit(action: NanoContractAction): Promise<{
        inputs: IDataInput[];
        outputs: IDataOutput[];
    }>;
    /**
     * Execute a withdrawal action
     * Create outputs to complete the withdrawal
     * If the transaction is a token creation and
     * the contract will pay for the deposit fee,
     * then creates the output only of the difference
     *
     * @param {action} Action to be completed (must be a withdrawal type)
     *
     * @memberof NanoContractTransactionBuilder
     * @inner
     */
    executeWithdrawal(action: NanoContractAction): IDataOutput | null;
    /**
     * Execute a grant authority action
     * Create inputs (and maybe change output) to complete the action
     *
     * @param {action} Action to be completed (must be a grant authority type)
     *
     * @memberof NanoContractTransactionBuilder
     * @inner
     */
    executeGrantAuthority(action: NanoContractAction): Promise<{
        inputs: IDataInput[];
        outputs: IDataOutput[];
    }>;
    /**
     * Execute an acquire authority action
     *
     * @param {action} Action to be completed (must be an acquire authority type)
     *
     * @memberof NanoContractTransactionBuilder
     * @inner
     */
    executeAcquireAuthority(action: NanoContractAction): IDataOutput | null;
    /**
     * Verify if the builder attributes are valid for the nano build
     *
     * @throws {NanoContractTransactionError} In case the attributes are not valid
     *
     * @memberof NanoContractTransactionBuilder
     * @inner
     */
    verify(): Promise<void>;
    /**
     * Serialize nano arguments in an array of Buffer
     * and store the serialized data in this.serializedArgs
     *
     * @throws {NanoContractTransactionError} In case the arguments are not valid
     *
     * @memberof NanoContractTransactionBuilder
     * @inner
     */
    serializeArgs(): Promise<void>;
    /**
     * Build inputs and outputs from nano actions
     *
     * @throws {Error} If a nano action type is invalid
     *
     * @memberof NanoContractTransactionBuilder
     * @inner
     */
    buildInputsOutputs(): Promise<{
        inputs: IDataInput[];
        outputs: IDataOutput[];
        tokens: string[];
    }>;
    /**
     * Build a transaction object from the built inputs/outputs/tokens
     *
     * It will create a Transaction or CreateTokenTransaction, depending on the vertex type
     *
     * @throws {NanoContractTransactionError} In case the create token options is null
     *
     * @memberof NanoContractTransactionBuilder
     * @inner
     */
    buildTransaction(inputs: IDataInput[], outputs: IDataOutput[], tokens: string[]): Promise<Transaction | CreateTokenTransaction>;
    /**
     * Build a full transaction with nano headers from nano contract data
     *
     * @throws {NanoContractTransactionError} In case the arguments to build the tx are invalid
     *
     * @memberof NanoContractTransactionBuilder
     * @inner
     */
    build(): Promise<Transaction>;
}
export default NanoContractTransactionBuilder;
//# sourceMappingURL=builder.d.ts.map