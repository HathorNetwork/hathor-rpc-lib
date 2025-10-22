/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference types="node" />
import SendTransaction from '../new/sendTransaction';
import HathorWallet from '../new/wallet';
import Network from '../models/network';
import Transaction from '../models/transaction';
import { IHistoryTx, IStorage } from '../types';
import { NanoContractAction, NanoContractActionHeader, IArgumentField } from './types';
/**
 * Sign a transaction and create a send transaction object
 *
 * @param tx Transaction to sign and send
 * @param pin Pin to decrypt data
 * @param storage Wallet storage object
 */
export declare const prepareNanoSendTransaction: (tx: Transaction, pin: string, storage: IStorage) => Promise<SendTransaction>;
/**
 * Get oracle buffer from oracle string (address in base58 or oracle data directly in hex)
 *
 * @param oracle Address in base58 or oracle data directly in hex
 * @param network Network to calculate the address
 */
export declare const getOracleBuffer: (oracle: string, network: Network) => Buffer;
/**
 * Get SignedData argument to use with a nano contract.
 *
 * @param oracleData Oracle data
 * @param contractId Id of the nano contract being invoked
 * @param argType Full method argument type string, e.g. 'SignedData[str]'
 * @param value Value to sign
 * @param wallet Hathor Wallet object
 */
export declare function getOracleSignedDataFromUser(oracleData: Buffer, contractId: string, argType: string, value: unknown, wallet: HathorWallet): Promise<import("./fields/signedData").IUserSignedData>;
/**
 * Get oracle input data
 *
 * @param oracleData Oracle data
 * @param contractId Id of the nano contract being invoked
 * @param resultSerialized Result to sign with oracle data already serialized
 * @param wallet Hathor Wallet object
 */
export declare const getOracleInputData: (oracleData: Buffer, contractId: string, resultSerialized: Buffer, wallet: HathorWallet) => Promise<Buffer>;
/**
 * [unsafe] Get oracle input data, signs received data raw.
 * This is meant to be used for RawSignedData
 *
 * @param oracleData Oracle data
 * @param resultSerialized Result to sign with oracle data already serialized
 * @param wallet Hathor Wallet object
 */
export declare const unsafeGetOracleInputData: (oracleData: Buffer, resultSerialized: Buffer, wallet: HathorWallet) => Promise<Buffer>;
/**
 * Validate if nano contracts arguments match the expected ones from the blueprint method
 * It also converts arguments that come from clients in a different type than the expected,
 * e.g., bytes come as hexadecimal strings and address (bytes) come as base58 string.
 * We convert them to the expected type and update the original array of arguments
 *
 * @param blueprintId Blueprint ID
 * @param method Method name
 * @param args Arguments of the method to check if have the expected types
 *
 * @throws NanoRequest404Error in case the blueprint ID does not exist on the full node
 */
export declare const validateAndParseBlueprintMethodArgs: (blueprintId: string, method: string, args: unknown[] | null, network: Network) => Promise<IArgumentField[]>;
/**
 * Checks if a transaction is a nano contract create transaction
 *
 * @param tx History object from hathor core to check if it's a nano create tx
 */
export declare const isNanoContractCreateTx: (tx: IHistoryTx) => boolean;
/**
 * Map a NanoContractAction object to NanoContractActionHeader
 *
 * @param action The action object to be mapped
 * @param tokens The tokens array to be used in the mapping
 *
 * @return The mapped action header object
 */
export declare const mapActionToActionHeader: (action: NanoContractAction, tokens: string[]) => NanoContractActionHeader;
//# sourceMappingURL=utils.d.ts.map