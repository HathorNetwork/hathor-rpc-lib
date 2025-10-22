/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
import { EventEmitter } from 'events';
import HathorWalletServiceWallet from './wallet';
import Transaction from '../models/transaction';
import Output from '../models/output';
import Input from '../models/input';
import { OutputSendTransaction, InputRequestObj, TokenAmountMap, ISendTransaction, MineTxSuccessData } from './types';
import { IDataTx } from '../types';
type optionsType = {
    outputs?: OutputSendTransaction[];
    inputs?: InputRequestObj[];
    changeAddress?: string | null;
    transaction?: Transaction | null;
    pin?: string | null;
};
declare class SendTransactionWalletService extends EventEmitter implements ISendTransaction {
    private wallet;
    private outputs;
    private inputs;
    private changeAddress;
    private transaction;
    private mineTransaction;
    private pin;
    fullTxData: IDataTx | null;
    private _utxosAddressPath;
    constructor(wallet: HathorWalletServiceWallet, options?: optionsType);
    /**
     * Prepare transaction data from inputs and outputs.
     *
     * This method provides more flexibility than `prepareTx` by allowing for mixed-input scenarios,
     * where some inputs are provided by the user and others are automatically selected from the wallet.
     * It processes both user-defined and automatically selected inputs, creates change outputs when
     * necessary, and constructs the final transaction object.
     *
     * The process is as follows:
     * 1. Calculate the total amount for each token from the outputs, including the cost of data outputs.
     * 2. Validate any user-provided inputs to ensure they are available and sufficient.
     * 3. For tokens where no inputs were provided, automatically select UTXOs from the wallet to cover the required amounts.
     * 4. Create change outputs for any tokens where the input value exceeds the output value.
     * 5. Construct the final transaction object with all inputs, outputs, and tokens.
     *
     * @returns {Promise<IDataTx>} A promise that resolves with the prepared transaction data.
     */
    prepareTxData(): Promise<IDataTx>;
    /**
     * Prepare transaction data to send
     * Get utxos from wallet service, creates change outpus and returns a Transaction object
     *
     * @memberof SendTransactionWalletService
     * @inner
     */
    prepareTx(): Promise<{
        transaction: Transaction;
        utxosAddressPath: string[];
    }>;
    /**
     * Map input data to an input object
     *
     * @memberof SendTransactionWalletService
     * @inner
     */
    inputDataToModel(input: InputRequestObj): Input;
    /**
     * Map output data to an output object
     *
     * @memberof SendTransactionWalletService
     * @inner
     */
    outputDataToModel(output: OutputSendTransaction, tokens: string[]): Output;
    /**
     * Check if the utxos selected are valid and the sum is enough to
     * fill the outputs. If needed, create change output
     *
     * @memberof SendTransactionWalletService
     * @inner
     */
    validateUtxos(tokenAmountMap: TokenAmountMap): Promise<string[]>;
    /**
     * Select utxos to be used in the transaction
     * Get utxos from wallet service and creates change output if needed
     *
     * @memberof SendTransactionWalletService
     * @inner
     */
    selectUtxosToUse(tokenAmountMap: TokenAmountMap): Promise<string[]>;
    /**
     * Signs the inputs of a transaction
     *
     * @memberof SendTransactionWalletService
     * @inner
     */
    signTx(utxosAddressPath: string[]): Promise<void>;
    /**
     * Mine the transaction
     * Expects this.transaction to be prepared and signed
     * Emits MineTransaction events while the process is ongoing
     *
     * @memberof SendTransactionWalletService
     * @inner
     */
    mineTx(options?: {}): Promise<MineTxSuccessData>;
    /**
     * Create and send a tx proposal to wallet service
     * Expects this.transaction to be prepared, signed and mined
     *
     * @memberof SendTransactionWalletService
     * @inner
     */
    handleSendTxProposal(): Promise<Transaction>;
    /**
     * Run sendTransaction from mining, i.e. expects this.transaction to be prepared and signed
     * then it will mine and handle tx proposal
     *
     * 'until' parameter can be 'mine-tx', in order to only mine the transaction without propagating
     *
     * @memberof SendTransactionWalletService
     * @inner
     */
    runFromMining(until?: string | null): Promise<Transaction>;
    /**
     * Run sendTransaction from preparing, i.e. prepare, sign, mine and send the tx
     *
     * 'until' parameter can be 'prepare-tx' (it will stop before signing the tx), 'sign-tx' (it will stop before mining the tx),
     * or 'mine-tx' (it will stop before send tx proposal, i.e. propagating the tx)
     *
     * @memberof SendTransactionWalletService
     * @inner
     */
    run(until?: string | null): Promise<Transaction>;
}
export default SendTransactionWalletService;
//# sourceMappingURL=sendTransactionWalletService.d.ts.map