import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { WalletServiceMethods } from '../SnapService';
import { NETWORKS, TOKEN_IDS } from '../../constants';

describe('SnapService - Critical Issues', () => {
  let mockInvokeSnap: Mock;

  beforeEach(() => {
    mockInvokeSnap = vi.fn();
    global.fetch = vi.fn();
  });

  describe('Critical Issue #1: Hardcoded Network Override', () => {
    it('should NOT override network parameter to testnet', async () => {
      const params = {
        network: NETWORKS.MAINNET, // User wants mainnet
        outputs: [
          {
            address: 'HAddr123',
            value: '100',
            token: TOKEN_IDS.HTR,
          }
        ],
        push_tx: true,
      };

      mockInvokeSnap.mockResolvedValueOnce({ txId: 'abc123' });

      await WalletServiceMethods.sendTransaction(mockInvokeSnap, params);

      // Verify the snap was called with mainnet, not testnet
      expect(mockInvokeSnap).toHaveBeenCalledWith({
        method: 'htr_sendTransaction',
        params: expect.objectContaining({
          network: NETWORKS.MAINNET, // Should preserve original network
        }),
      });
    });

    it('should respect testnet when explicitly passed', async () => {
      const params = {
        network: NETWORKS.TESTNET,
        outputs: [
          {
            address: 'HAddr123',
            value: '100',
            token: TOKEN_IDS.HTR,
          }
        ],
        push_tx: true,
      };

      mockInvokeSnap.mockResolvedValueOnce({ txId: 'abc123' });

      await WalletServiceMethods.sendTransaction(mockInvokeSnap, params);

      expect(mockInvokeSnap).toHaveBeenCalledWith({
        method: 'htr_sendTransaction',
        params: expect.objectContaining({
          network: NETWORKS.TESTNET,
        }),
      });
    });

  });

  // Note: getTransactionHistory tests moved to HathorApiService.test.ts

  describe('Critical Issue #2: sendTransaction Error Handling', () => {
    it('should distinguish user rejection from other errors', async () => {
      // User rejected transaction (snap returns null)
      mockInvokeSnap.mockResolvedValueOnce(null);

      await expect(
        WalletServiceMethods.sendTransaction(mockInvokeSnap, {
          network: NETWORKS.TESTNET,
          outputs: [
            {
              address: 'HAddr123',
              value: '100',
              token: TOKEN_IDS.HTR,
            }
          ],
          push_tx: true,
        })
      ).rejects.toThrow(/cancel|reject/i);
    });

    it('should handle snap errors gracefully', async () => {
      mockInvokeSnap.mockRejectedValueOnce(new Error('Insufficient funds'));

      await expect(
        WalletServiceMethods.sendTransaction(mockInvokeSnap, {
          network: NETWORKS.TESTNET,
          outputs: [
            {
              address: 'HAddr123',
              value: '100',
              token: TOKEN_IDS.HTR,
            }
          ],
          push_tx: true,
        })
      ).rejects.toThrow('Insufficient funds');
    });

    it('should propagate error code 4001 (user rejection)', async () => {
      const rejectionError = Object.assign(new Error('User rejected'), { code: 4001 });
      mockInvokeSnap.mockRejectedValueOnce(rejectionError);

      await expect(
        WalletServiceMethods.sendTransaction(mockInvokeSnap, {
          network: NETWORKS.TESTNET,
          outputs: [
            {
              address: 'HAddr123',
              value: '100',
              token: TOKEN_IDS.HTR,
            }
          ],
          push_tx: true,
        })
      ).rejects.toThrow('User rejected');
    });

    it('should successfully send transaction when snap returns valid response', async () => {
      const mockResponse = { txId: 'abc123', success: true };
      mockInvokeSnap.mockResolvedValueOnce(mockResponse);

      const result = await WalletServiceMethods.sendTransaction(mockInvokeSnap, {
        network: NETWORKS.TESTNET,
        outputs: [
          {
            address: 'HAddr123',
            value: '100',
            token: TOKEN_IDS.HTR,
          }
        ],
        push_tx: true,
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Critical Issue #3: getBalance Silent Failures', () => {
    it('should throw error when snap returns null', async () => {
      mockInvokeSnap.mockResolvedValueOnce(null);

      await expect(
        WalletServiceMethods.getBalance(mockInvokeSnap)
      ).rejects.toThrow(/snap not responding|balance/i);
    });

    it('should throw error on snap RPC failures', async () => {
      mockInvokeSnap.mockRejectedValueOnce(new Error('Snap not connected'));

      await expect(
        WalletServiceMethods.getBalance(mockInvokeSnap)
      ).rejects.toThrow('Snap not connected');
    });

    it('should successfully return balance when snap works', async () => {
      const mockBalance = [
        { token: TOKEN_IDS.HTR, available: 10000n, locked: 500n },
      ];
      // The snap returns { response: [...] } format
      mockInvokeSnap.mockResolvedValueOnce({ response: mockBalance });

      const result = await WalletServiceMethods.getBalance(mockInvokeSnap);

      expect(result).toEqual(mockBalance);
    });
  });
});
