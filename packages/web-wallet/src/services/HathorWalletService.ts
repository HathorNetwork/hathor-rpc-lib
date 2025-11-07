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

/**
 * Custom error class for unauthorized snap errors
 */
export class SnapUnauthorizedError extends Error {
  code: number;

  constructor(message: string, code: number = 4100) {
    super(message);
    this.name = 'SnapUnauthorizedError';
    this.code = code;
  }
}

/**
 * Checks if an error is an unauthorized error (code 4100)
 */
function isUnauthorizedError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as { code?: number; message?: string };
    return errorObj.code === 4100 ||
           (errorObj.message?.includes('Unauthorized') ?? false) ||
           (errorObj.message?.includes('permission') ?? false);
  }
  return false;
}

/**
 * Wraps snap calls with error handling for unauthorized errors
 */
async function wrapSnapCall<T>(
  methodName: string,
  snapCall: () => Promise<T>
): Promise<T> {
  try {
    return await snapCall();
  } catch (error) {
    console.error(`[HathorWalletService] ${methodName} failed:`, error);

    if (isUnauthorizedError(error)) {
      console.error('[HathorWalletService] Unauthorized error detected - throwing SnapUnauthorizedError');
      throw new SnapUnauthorizedError(
        'Snap permissions have been revoked or changed. Please reconnect your wallet.',
        4100
      );
    }

    throw error;
  }
}

// These will be used by the wallet context with the hooks
export const WalletServiceMethods = {
  async getAddress(invokeSnap: InvokeSnapFunction, type: 'index' = 'index', index: number = 0): Promise<string> {
    return wrapSnapCall('getAddress', async () => {
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
    });
  },

  async getBalance(invokeSnap: InvokeSnapFunction, tokens: string[] = [TOKEN_IDS.HTR]): Promise<WalletBalance[]> {
    return wrapSnapCall('getBalance', async () => {
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
    });
  },

  async getConnectedNetwork(invokeSnap: InvokeSnapFunction): Promise<string> {
    return wrapSnapCall('getConnectedNetwork', async () => {
      const response = await invokeSnap({
        method: 'htr_getConnectedNetwork'
      }) as { response?: string } | null;
      if (!response) {
        return DEFAULT_NETWORK;
      }
      return response.response || DEFAULT_NETWORK;
    });
  },

  async sendTransaction(invokeSnap: InvokeSnapFunction, params: SendTransactionParams): Promise<unknown> {
    console.log('[HathorWalletService] sendTransaction called with params:', JSON.stringify(params, null, 2));

    return wrapSnapCall('sendTransaction', async () => {
      console.log('[HathorWalletService] Invoking snap with htr_sendTransaction...');
      const response = await invokeSnap({
        method: 'htr_sendTransaction',
        params: params as unknown as Record<string, unknown>
      }) as { response?: unknown } | null;

      console.log('[HathorWalletService] Snap response:', response);

      if (!response) {
        console.error('[HathorWalletService] No response from snap (user cancelled or rejected)');
        throw new Error('Transaction was cancelled or rejected');
      }

      console.log('[HathorWalletService] Transaction sent successfully');
      return response.response || response;
    });
  },

  async getUtxos(invokeSnap: InvokeSnapFunction, filters?: {
    token?: string;
    filterAddress?: string;
    amountBiggerThan?: number;
    amountSmallerThan?: number;
    maxUtxos?: number;
    maximumAmount?: number;
  }): Promise<unknown[]> {
    return wrapSnapCall('getUtxos', async () => {
      const response = await invokeSnap({
        method: 'htr_getUtxos',
        params: filters || {}
      }) as { response?: unknown[] } | null;
      return (response?.response as unknown[]) || [];
    });
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
