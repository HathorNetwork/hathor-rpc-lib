import { HATHOR_API_URLS, NETWORKS, TOKEN_IDS, DEFAULT_NETWORK } from '../constants';

export interface WalletBalance {
  token: string;
  available: number;
  locked: number;
}

export interface TransactionOutput {
  address?: string;
  value?: string;
  token?: string;
  type?: string;
  data?: string;
}

export interface SendTransactionParams {
  network: string;
  outputs: TransactionOutput[];
  inputs?: Array<{ txId: string; index: number }>;
  changeAddress?: string;
}

export interface Transaction {
  txId: string;
  timestamp: number;
  inputs: Array<{
    address: string;
    value: number;
    token: string;
  }>;
  outputs: Array<{
    address: string;
    value: number;
    token: string;
  }>;
  confirmed: boolean;
}

// These will be used by the wallet context with the hooks
export const WalletServiceMethods = {
  async getAddress(invokeSnap: any, type: 'index' = 'index', index: number = 0): Promise<string> {
    try {
      const response = await invokeSnap({
        method: 'htr_getAddress',
        params: {
          type,
          index
        }
      });
      if (!response) {
        return '';
      }
      return response.response || '';
    } catch (error) {
      console.error('Failed to get address:', error);
      throw error;
    }
  },

  async getBalance(invokeSnap: any, tokens: string[] = [TOKEN_IDS.HTR]): Promise<WalletBalance[]> {
    try {
      const response = await invokeSnap({
        method: 'htr_getBalance',
        params: {
          network: DEFAULT_NETWORK,
          tokens
        }
      });

      if (!response) {
        console.error('Received null response from snap - snap may not be responding');
        throw new Error('Failed to get balance: snap not responding');
      }

      const balances = response.response?.map((balance: any) => ({
        token: balance.token_id || balance.token,
        available: balance.available || 0,
        locked: balance.locked || 0
      })) || [];

      return balances;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  },

  async getConnectedNetwork(invokeSnap: any): Promise<string> {
    try {
      const response = await invokeSnap({
        method: 'htr_getConnectedNetwork'
      });
      if (!response) {
        return DEFAULT_NETWORK;
      }
      return response.response || DEFAULT_NETWORK;
    } catch (error) {
      console.error('Failed to get network:', error);
      throw error;
    }
  },

  async sendTransaction(invokeSnap: any, params: SendTransactionParams): Promise<any> {
    try {
      const response = await invokeSnap({
        method: 'htr_sendTransaction',
        params
      });

      if (!response) {
        throw new Error('Transaction was cancelled or rejected');
      }

      return response.response || response;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  },

  async getUtxos(invokeSnap: any, filters?: {
    token?: string;
    filterAddress?: string;
    amountBiggerThan?: number;
    amountSmallerThan?: number;
    maxUtxos?: number;
    maximumAmount?: number;
  }): Promise<any[]> {
    try {
      const response = await invokeSnap({
        method: 'htr_getUtxos',
        params: filters || {}
      });
      return response.response || [];
    } catch (error) {
      console.error('Failed to get UTXOs:', error);
      throw error;
    }
  },

  async getTransactionHistory(address: string, network: string = DEFAULT_NETWORK): Promise<Transaction[]> {
    try {
      // Use Hathor public API to get transaction history
      const baseUrl = network === NETWORKS.MAINNET
        ? HATHOR_API_URLS.MAINNET
        : HATHOR_API_URLS.TESTNET;

      const response = await fetch(`${baseUrl}/thin_wallet/address_history?addresses[]=${address}`);

      if (!response.ok) {
        throw new Error('Failed to fetch transaction history');
      }

      const data = await response.json();

      // Transform the API response to our Transaction interface
      return data.history?.map((tx: any) => ({
        txId: tx.tx_id,
        timestamp: tx.timestamp * 1000, // Convert to milliseconds
        inputs: tx.inputs || [],
        outputs: tx.outputs || [],
        confirmed: tx.is_voided === false
      })) || [];
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      throw error;
    }
  }
};

export default WalletServiceMethods;
