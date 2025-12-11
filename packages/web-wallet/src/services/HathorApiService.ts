import { HATHOR_API_URLS, NETWORKS, DEFAULT_NETWORK } from '../constants';
import { createLogger } from '../utils/logger';

const log = createLogger('HathorApiService');

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
 * Service for direct Hathor API calls (not snap-related)
 */
export const HathorApiService = {
  async getTransactionHistory(address: string, network: string = DEFAULT_NETWORK): Promise<Transaction[]> {
    try {
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

      return data.history?.map((tx) => ({
        txId: tx.tx_id,
        timestamp: tx.timestamp * 1000,
        inputs: tx.inputs || [],
        outputs: tx.outputs || [],
        confirmed: tx.is_voided === false
      })) || [];
    } catch (error) {
      log.error('Failed to get transaction history:', error);
      throw error;
    }
  }
};

export default HathorApiService;
