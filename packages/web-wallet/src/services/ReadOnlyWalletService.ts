import { HathorWalletServiceWallet, Network, config } from '@hathor/wallet-lib';
import { NETWORKS, WALLET_SERVICE_URLS, WALLET_SERVICE_WS_URLS } from '../constants';

export interface WalletBalance {
  token: string;
  available: number;
  locked: number;
}

export interface TransactionHistoryItem {
  tx_id: string;
  timestamp: number;
  balance: number;
  is_voided: boolean;
}

export interface AddressInfo {
  address: string;
  index: number;
  transactions: number;
}

/**
 * Service for managing a read-only wallet instance using wallet-lib.
 * This wallet can perform all read operations but cannot sign transactions.
 */
export class ReadOnlyWalletService {
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
      throw new Error('Wallet is already initializing');
    }

    if (this.wallet?.isReady()) {
      console.log('Wallet already initialized and ready');
      return;
    }

    this.isInitializing = true;

    try {
      console.log('Initializing read-only wallet with xpub:', xpub.substring(0, 20) + '...');

      // Get wallet service URLs based on network
      let walletServiceUrl: string;
      let walletServiceWsUrl: string;
      let actualNetwork: string; // The network value for wallet-lib (mainnet or testnet)

      if (network === NETWORKS.DEV_TESTNET || network === 'dev-testnet') {
        walletServiceUrl = WALLET_SERVICE_URLS.DEV_TESTNET;
        walletServiceWsUrl = WALLET_SERVICE_WS_URLS.DEV_TESTNET;
        actualNetwork = 'testnet'; // wallet-lib only understands 'mainnet' or 'testnet'
      } else if (network === NETWORKS.TESTNET || network === 'testnet') {
        walletServiceUrl = WALLET_SERVICE_URLS.TESTNET;
        walletServiceWsUrl = WALLET_SERVICE_WS_URLS.TESTNET;
        actualNetwork = 'testnet';
      } else {
        walletServiceUrl = WALLET_SERVICE_URLS.MAINNET;
        walletServiceWsUrl = WALLET_SERVICE_WS_URLS.MAINNET;
        actualNetwork = 'mainnet';
      }

      console.log('Using wallet service URL:', walletServiceUrl);
      console.log('Using wallet service WS URL:', walletServiceWsUrl);
      console.log('Using network for wallet-lib:', actualNetwork);

      // Set global wallet-lib config
      config.setWalletServiceBaseUrl(walletServiceUrl);
      config.setWalletServiceBaseWsUrl(walletServiceWsUrl);

      // Create wallet instance with xpub only
      this.wallet = new HathorWalletServiceWallet({
        xpub,
        network: new Network(actualNetwork),
        requestPassword: async () => '', // Not used for read-only mode
        enableWs: true, // Enable WebSocket for real-time updates
      });

      // Set up event listeners for wallet state changes
      this.wallet.on('state', (state: any) => {
        console.log('Read-only wallet state:', state);
      });

      this.wallet.on('new-tx', (tx: any) => {
        console.log('New transaction received:', tx.tx_id);
      });

      this.wallet.on('update-tx', (tx: any) => {
        console.log('Transaction updated:', tx.tx_id);
      });

      this.wallet.on('reload-data', () => {
        console.log('Connection restored, data should be reloaded');
      });

      // Start wallet in read-only mode
      try {
        await this.wallet.startReadOnly();
        console.log('Read-only wallet started successfully');
      } catch (error: any) {
        // Check if this is a "wallet already loaded" error (400 status)
        // The wallet-service returns 400 when wallet already exists
        if (error?.response?.data?.error === 'wallet-already-loaded') {
          console.log('✅ Wallet already exists on wallet-service (read-only mode)');
          // Wallet is already loaded, this is OK for read-only access
        } else {
          // For other errors, re-throw
          throw error;
        }
      }

      console.log('Read-only wallet ready');
    } catch (error) {
      console.error('Failed to initialize read-only wallet:', error);
      this.isInitializing = false; // Reset flag before clearing wallet
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
   */
  async getBalance(tokenId?: string): Promise<WalletBalance[]> {
    if (!this.wallet?.isReady()) {
      throw new Error('Wallet not initialized');
    }

    try {
      const balance = await this.wallet.getBalance(tokenId);

      // Transform the wallet-lib balance format to our interface
      const balances: WalletBalance[] = Object.entries(balance).map(([token, data]: [string, any]) => ({
        token,
        available: data.balance?.unlocked || 0,
        locked: data.balance?.locked || 0,
      }));

      return balances;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(count: number = 10, skip: number = 0, tokenId: string = '00'): Promise<TransactionHistoryItem[]> {
    if (!this.wallet?.isReady()) {
      throw new Error('Wallet not initialized');
    }

    try {
      const history = await this.wallet.getTxHistory({
        token_id: tokenId,
        count,
        skip,
      });

      return history;
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      throw error;
    }
  }

  /**
   * Get current address
   */
  async getCurrentAddress(): Promise<AddressInfo | null> {
    if (!this.wallet?.isReady()) {
      throw new Error('Wallet not initialized');
    }

    try {
      const addressInfo = this.wallet.getCurrentAddress();
      return {
        address: addressInfo.address,
        index: addressInfo.index,
        transactions: addressInfo.transactions || 0,
      };
    } catch (error) {
      console.error('Failed to get current address:', error);
      throw error; // Re-throw instead of returning null
    }
  }

  /**
   * Get address at a specific index
   */
  async getAddressAtIndex(index: number): Promise<AddressInfo | null> {
    if (!this.wallet?.isReady()) {
      throw new Error('Wallet not initialized');
    }

    try {
      const addressInfo = await this.wallet.getAddressAtIndex(index);
      return {
        address: addressInfo.address,
        index: addressInfo.index,
        transactions: addressInfo.transactions || 0,
      };
    } catch (error) {
      console.error('Failed to get address at index:', error);
      throw error;
    }
  }

  /**
   * Get all addresses (returns an async generator)
   */
  async *getAllAddresses(): AsyncGenerator<AddressInfo> {
    if (!this.wallet?.isReady()) {
      throw new Error('Wallet not initialized');
    }

    try {
      const addresses = this.wallet.getAllAddresses();
      for await (const addr of addresses) {
        yield {
          address: addr.address,
          index: addr.index,
          transactions: addr.transactions || 0,
        };
      }
    } catch (error) {
      console.error('Failed to get all addresses:', error);
      throw error;
    }
  }

  /**
   * Check if an address belongs to this wallet
   */
  async isAddressMine(address: string): Promise<boolean> {
    if (!this.wallet?.isReady()) {
      throw new Error('Wallet not initialized');
    }

    try {
      return await this.wallet.isAddressMine(address);
    } catch (error) {
      console.error('Failed to check if address is mine:', error);
      // Re-throw instead of returning false - calling code needs to distinguish
      // between "not mine" (false) and "failed to check" (error)
      throw error;
    }
  }

  /**
   * Get UTXOs for the wallet
   */
  async getUtxos(options?: {
    token?: string;
    max_utxos?: number;
    filter_address?: string;
    amount_bigger_than?: number;
    amount_smaller_than?: number;
  }): Promise<any[]> {
    if (!this.wallet?.isReady()) {
      throw new Error('Wallet not initialized');
    }

    try {
      return await this.wallet.getUtxos(options || {});
    } catch (error) {
      console.error('Failed to get UTXOs:', error);
      throw error;
    }
  }

  /**
   * Get tokens in the wallet
   */
  async getTokens(): Promise<any[]> {
    if (!this.wallet?.isReady()) {
      throw new Error('Wallet not initialized');
    }

    try {
      return await this.wallet.getTokens();
    } catch (error) {
      console.error('Failed to get tokens:', error);
      throw error;
    }
  }

  /**
   * Stop the wallet and cleanup resources
   */
  async stop(): Promise<void> {
    if (this.wallet) {
      try {
        // Remove all event listeners before stopping
        this.wallet.removeAllListeners();
        await this.wallet.stop();
      } catch (error) {
        console.error('Failed to stop wallet:', error);
        // Still clear the wallet reference even if stop() fails
        // to prevent memory leaks and allow re-initialization
        this.wallet = null;
        throw error;
      } finally {
        // Always clear the wallet reference
        this.wallet = null;
      }
    }
  }

  /**
   * Register event listener for wallet events
   */
  on(event: string, callback: (data: any) => void): void {
    if (this.wallet) {
      this.wallet.on(event, callback);
    }
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (data: any) => void): void {
    if (this.wallet) {
      this.wallet.off(event, callback);
    }
  }
}

// Export a singleton instance
export const readOnlyWalletService = new ReadOnlyWalletService();
