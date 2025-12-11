import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { HathorApiService } from '../HathorApiService';
import { NETWORKS } from '../../constants';

describe('HathorApiService', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  describe('getTransactionHistory', () => {
    it('should throw error instead of returning empty array on fetch failure', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        HathorApiService.getTransactionHistory('HAddr123', NETWORKS.MAINNET)
      ).rejects.toThrow();
    });

    it('should throw error on network failures', async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error('Network timeout'));

      await expect(
        HathorApiService.getTransactionHistory('HAddr123', NETWORKS.MAINNET)
      ).rejects.toThrow('Network timeout');
    });

    it('should throw error on invalid JSON response', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      });

      await expect(
        HathorApiService.getTransactionHistory('HAddr123', NETWORKS.MAINNET)
      ).rejects.toThrow('Invalid JSON');
    });

    it('should successfully return transaction history when API works', async () => {
      const mockHistory = {
        history: [
          {
            tx_id: 'abc123',
            timestamp: 1000,
            is_voided: false,
            inputs: [],
            outputs: [{ value: 100 }],
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockHistory),
      });

      const result = await HathorApiService.getTransactionHistory('HAddr123', NETWORKS.MAINNET);

      expect(result).toHaveLength(1);
      expect(result[0].txId).toBe('abc123');
      expect(result[0].timestamp).toBe(1000000); // Converted to milliseconds
    });
  });
});
