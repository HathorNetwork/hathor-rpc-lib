/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { IStorage } from '../types';
import HathorWalletServiceWallet from './wallet';
/**
 * Storage proxy that implements missing storage methods for wallet service
 * by delegating to wallet service API calls.
 *
 * This proxy enables nano contract transaction signing by providing:
 * - getAddressInfo: Maps addresses to BIP32 indices
 * - getTx: Fetches transaction data from full node API
 * - getTxSignatures: Delegates to transaction signing utilities
 */
export declare class WalletServiceStorageProxy {
    private wallet;
    private originalStorage;
    constructor(wallet: HathorWalletServiceWallet, originalStorage: IStorage);
    /**
     * Creates a proxy that wraps the original storage with additional methods
     * needed for nano contract transaction signing.
     */
    createProxy(): IStorage;
    private proxyHandler;
    /**
     * Get address information including BIP32 index
     * First tries local wallet cache, then falls back to API
     */
    private getAddressInfo;
    /**
     * Get transaction signatures using the transaction utility
     */
    private getTxSignatures;
    /**
     * Get spent transactions for input signing
     * This is an async generator that yields transaction data for each input
     */
    private getSpentTxs;
    /**
     * Get transaction data by fetching from full node and converting format
     */
    private getTx;
    /**
     * Get current address from wallet service
     * Uses the wallet's getCurrentAddress method which fetches from the API
     */
    private getCurrentAddress;
    /**
     * Convert FullNodeTxResponse to IHistoryTx format
     * This bridges the gap between full node API format and wallet storage format
     */
    private convertFullNodeToHistoryTx;
}
//# sourceMappingURL=walletServiceStorageProxy.d.ts.map