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
      // Handle null response when snap is not connected
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
      console.log('🔍 Getting balance with params:', { network: DEFAULT_NETWORK, tokens });
      
      const response = await invokeSnap({
        method: 'htr_getBalance',
        params: {
          network: DEFAULT_NETWORK,
          tokens
        }
      });

      console.log('📡 Raw balance response from snap:', response);

      // Handle null response when snap is not connected
      if (!response) {
        console.warn('⚠️ Received null response from snap');
        return [];
      }

      console.log('📊 Balance response.response:', response.response);

      // Transform the response to match our interface
      const balances = response.response?.map((balance: any) => {
        console.log('💰 Processing balance item:', balance);
        return {
          token: balance.token_id || balance.token,
          available: balance.available || 0,
          locked: balance.locked || 0
        };
      }) || [];

      console.log('✅ Final processed balances:', balances);
      return balances;
    } catch (error) {
      console.error('❌ Failed to get balance:', error);
      throw error;
    }
  },

  async getConnectedNetwork(invokeSnap: any): Promise<string> {
    try {
      const response = await invokeSnap({
        method: 'htr_getConnectedNetwork'
      });
      // Handle null response when snap is not connected
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
      console.log('📤 Sending transaction with params:', params);
      const response = await invokeSnap({
        method: 'htr_sendTransaction',
        params
      });
      console.log('📥 Send transaction response:', response);

      // Handle null response (user might have rejected)
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
      // Return empty array instead of throwing to avoid breaking the UI
      return [];
    }
  }
};

export default WalletServiceMethods;
