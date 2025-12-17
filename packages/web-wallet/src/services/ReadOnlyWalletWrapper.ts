import { HathorWalletServiceWallet, Network, config } from '@hathor/wallet-lib';
import type { GetHistoryObject, AddressInfoObject } from '@hathor/wallet-lib/lib/wallet/types';
import { NETWORKS, WALLET_SERVICE_URLS, WALLET_SERVICE_WS_URLS, TOKEN_IDS } from '../constants';
import type { WalletBalance, TransactionHistoryItem } from '../types/wallet';
import { toBigInt } from '../utils/hathor';
import { createLogger } from '../utils/logger';
import { ERROR_PATTERNS } from '../errors/WalletConnectionErrors';

const log = createLogger('ReadOnlyWalletWrapper');

export interface AddressInfo {
  address: string;
  index: number;
  transactions: number;
}

/**
 * Service for managing a read-only wallet instance using wallet-lib.
 * This wallet can perform all read operations but cannot sign transactions.
 */
export class ReadOnlyWalletWrapper {
  private wallet: HathorWalletServiceWallet | null = null;
  private isInitializing = false;

  /**
   * Initialize the read-only wallet with the user's xpubkey.
   *
   * @param xpub - The extended public key (xpub) for the wallet
   * @param network - The network to connect to ('mainnet' or 'testnet')
   */
  async initialize(xpub: string, network: string = NETWORKS.MAINNET): Promise<void> {
    if (this.isInitializing) {
      throw new Error(ERROR_PATTERNS.ALREADY_INITIALIZING);
    }

    if (this.wallet?.isReady()) {
      return;
    }

    this.isInitializing = true;

    try {
      // Network URL Mapping:
      // - User-facing networks: 'mainnet', 'testnet'
      // - wallet-lib networks: only 'mainnet' or 'testnet'
      let walletServiceUrl: string;
      let walletServiceWsUrl: string;
      let actualNetwork: string;

      if (network === NETWORKS.TESTNET) {
        walletServiceUrl = WALLET_SERVICE_URLS.TESTNET;
        walletServiceWsUrl = WALLET_SERVICE_WS_URLS.TESTNET;
        actualNetwork = 'testnet';
      } else {
        // Default to mainnet for any unrecognized network
        walletServiceUrl = WALLET_SERVICE_URLS.MAINNET;
        walletServiceWsUrl = WALLET_SERVICE_WS_URLS.MAINNET;
        actualNetwork = 'mainnet';
      }

      // Set global wallet-lib config
      config.setWalletServiceBaseUrl(walletServiceUrl);
      config.setWalletServiceBaseWsUrl(walletServiceWsUrl);
      config.setNetwork(actualNetwork);

      // Create wallet instance with xpub only
      this.wallet = new HathorWalletServiceWallet({
        xpub,
        network: new Network(actualNetwork),
        requestPassword: async () => '', // Not used for read-only mode
        enableWs: true, // Enable WebSocket for real-time updates
      });

      // Start wallet in read-only mode
      try {
        await this.wallet.startReadOnly();
      } catch (error: unknown) {
        // Check if this is a "wallet already loaded" error (400 status)
        // The wallet-service returns 400 when wallet already exists
        const errorObj = error as { response?: { data?: { error?: string } } };
        if (errorObj?.response?.data?.error === ERROR_PATTERNS.WALLET_ALREADY_LOADED) {
          // Wallet already exists, continue
        } else {
          // For other errors, re-throw
          throw error;
        }
      }
    } catch (error) {
      log.error('Failed to initialize read-only wallet:', error);
      this.wallet = null;
      throw error;
    } finally {
      // Ensure flag is always reset
      this.isInitializing = false;
    }
  }

  /**
   * Check if the wallet is ready for operations
   */
  isReady(): boolean {
    return this.wallet?.isReady() ?? false;
  }

  /**
   * Get the wallet instance
   */
  getWallet(): HathorWalletServiceWallet | null {
    return this.wallet;
  }

  /**
   * Get balance for all tokens or specific tokens
   * Returns a Map for O(1) token lookups
   */
  async getBalance(tokenId?: string): Promise<Map<string, WalletBalance>> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      const balance = await this.wallet.getBalance(tokenId);

      // Transform the wallet-lib balance format (array) to Map
      const balances = new Map<string, WalletBalance>();

      // wallet-lib returns an array of balance objects
      if (Array.isArray(balance)) {
        for (const item of balance) {
          balances.set(item.token.id, {
            token: item.token.id,
            available: item.balance.unlocked ? toBigInt(item.balance.unlocked) : 0n,
            locked: item.balance.locked ? toBigInt(item.balance.locked) : 0n,
          });
        }
      }

      return balances;
    } catch (error) {
      log.error('Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(count: number = 10, skip: number = 0, tokenId: string = TOKEN_IDS.HTR): Promise<TransactionHistoryItem[]> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      const history: GetHistoryObject[] = await this.wallet.getTxHistory({
        token_id: tokenId,
        count,
        skip,
      });

      // Transform GetHistoryObject[] to TransactionHistoryItem[]
      return history.map((item: GetHistoryObject) => ({
        tx_id: item.txId,
        timestamp: item.timestamp,
        balance: toBigInt(item.balance),
        is_voided: item.voided,
      }));
    } catch (error) {
      log.error('Failed to get transaction history:', error);
      throw error;
    }
  }

  /**
   * Get current address
   */
  getCurrentAddress(): AddressInfo | null {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      const addressInfo: AddressInfoObject = this.wallet.getCurrentAddress();
      return {
        address: addressInfo.address,
        index: addressInfo.index,
        transactions: 0, // AddressInfoObject doesn't have transactions field
      };
    } catch (error) {
      log.error('Failed to get current address:', error);
      throw error; // Re-throw instead of returning null
    }
  }

  /**
   * Get address at a specific index
   */
  async getAddressAtIndex(index: number): Promise<AddressInfo | null> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      const addressStr: string = await this.wallet.getAddressAtIndex(index);
      return {
        address: addressStr,
        index: index,
        transactions: 0,
      };
    } catch (error) {
      log.error('Failed to get address at index:', error);
      throw error;
    }
  }

  /**
   * Get all addresses (returns an async generator)
   */
  async *getAllAddresses(): AsyncGenerator<AddressInfo> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      const addresses = this.wallet.getAllAddresses();
      for await (const addr of addresses) {
        yield {
          address: addr.address,
          index: addr.index,
          transactions: addr.transactions,
        };
      }
    } catch (error) {
      log.error('Failed to get all addresses:', error);
      throw error;
    }
  }

  /**
   * Check if an address belongs to this wallet
   */
  async isAddressMine(address: string): Promise<boolean> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      return await this.wallet.isAddressMine(address);
    } catch (error) {
      log.error('Failed to check if address is mine:', error);
      // Re-throw instead of returning false - calling code needs to distinguish
      // between "not mine" (false) and "failed to check" (error)
      throw error;
    }
  }

  /**
   * Get tokens in the wallet
   */
  async getTokens(): Promise<Array<Record<string, unknown>>> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      const tokens = await this.wallet.getTokens();
      // wallet-lib returns string[] but we need Record<string, unknown>[]
      return tokens as unknown as Array<Record<string, unknown>>;
    } catch (error) {
      log.error('Failed to get tokens:', error);
      throw error;
    }
  }

  /**
   * Stop the wallet and cleanup resources
   */
  async stop(): Promise<void> {
    if (!this.wallet) return;

    try {
      await this.wallet.stop();
    } finally {
      this.wallet = null;
    }
  }

  /**
   * Register event listener for wallet events
   */
  on(event: string, callback: (data: unknown) => void): void {
    if (this.wallet) {
      this.wallet.on(event, callback);
    }
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (data: unknown) => void): void {
    if (this.wallet) {
      this.wallet.off(event, callback);
    }
  }

  /**
   * Remove all event listeners from the wallet
   */
  removeAllListeners(): void {
    if (this.wallet) {
      this.wallet.removeAllListeners();
    }
  }
}

// Export a singleton instance
export const readOnlyWalletWrapper = new ReadOnlyWalletWrapper();
