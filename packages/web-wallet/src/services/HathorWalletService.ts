import { HATHOR_API_URLS, NETWORKS, TOKEN_IDS, DEFAULT_NETWORK } from '../constants';
import type { WalletBalance } from '../types/wallet';

// Type for the invokeSnap function from snap-utils
type InvokeSnapFunction = (params: { method: string; params?: Record<string, unknown> }) => Promise<unknown>;

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
    value: bigint;
    token: string;
  }>;
  outputs: Array<{
    address: string;
    value: bigint;
    token: string;
  }>;
  confirmed: boolean;
}

// These will be used by the wallet context with the hooks
export const WalletServiceMethods = {
  async getAddress(invokeSnap: InvokeSnapFunction, type: 'index' = 'index', index: number = 0): Promise<string> {
    try {
      const response = await invokeSnap({
        method: 'htr_getAddress',
        params: {
          type,
          index
        }
      }) as { response?: string } | null;
      if (!response) {
        return '';
      }
      return response.response || '';
    } catch (error) {
      console.error('Failed to get address:', error);
      throw error;
    }
  },

  async getBalance(invokeSnap: InvokeSnapFunction, tokens: string[] = [TOKEN_IDS.HTR]): Promise<WalletBalance[]> {
    try {
      const response = await invokeSnap({
        method: 'htr_getBalance',
        params: {
          network: DEFAULT_NETWORK,
          tokens
        }
      }) as { response?: Array<{ token_id?: string; token?: string; available?: number | bigint; locked?: number | bigint }> } | null;

      if (!response) {
        console.error('Received null response from snap - snap may not be responding');
        throw new Error('Failed to get balance: snap not responding');
      }

      const balances = response.response?.map((balance) => ({
        token: balance.token_id || balance.token || '',
        available: balance.available ? (typeof balance.available === 'bigint' ? balance.available : BigInt(balance.available)) : 0n,
        locked: balance.locked ? (typeof balance.locked === 'bigint' ? balance.locked : BigInt(balance.locked)) : 0n
      })) || [];

      return balances;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  },

  async getConnectedNetwork(invokeSnap: InvokeSnapFunction): Promise<string> {
    try {
      const response = await invokeSnap({
        method: 'htr_getConnectedNetwork'
      }) as { response?: string } | null;
      if (!response) {
        return DEFAULT_NETWORK;
      }
      return response.response || DEFAULT_NETWORK;
    } catch (error) {
      console.error('Failed to get network:', error);
      throw error;
    }
  },

  async sendTransaction(invokeSnap: InvokeSnapFunction, params: SendTransactionParams): Promise<unknown> {
    try {
      const response = await invokeSnap({
        method: 'htr_sendTransaction',
        params: params as unknown as Record<string, unknown>
      }) as { response?: unknown } | null;

      if (!response) {
        throw new Error('Transaction was cancelled or rejected');
      }

      return response.response || response;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  },

  async getUtxos(invokeSnap: InvokeSnapFunction, filters?: {
    token?: string;
    filterAddress?: string;
    amountBiggerThan?: number;
    amountSmallerThan?: number;
    maxUtxos?: number;
    maximumAmount?: number;
  }): Promise<unknown[]> {
    try {
      const response = await invokeSnap({
        method: 'htr_getUtxos',
        params: filters || {}
      }) as { response?: unknown[] } | null;
      return (response?.response as unknown[]) || [];
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

      const data = await response.json() as { history?: Array<{
        tx_id: string;
        timestamp: number;
        inputs?: Transaction['inputs'];
        outputs?: Transaction['outputs'];
        is_voided?: boolean;
      }> };

      // Transform the API response to our Transaction interface
      return data.history?.map((tx) => ({
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
