import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletServiceMethods } from '../HathorWalletService';

describe('HathorWalletService - Critical Issues', () => {
  let mockInvokeSnap: any;

  beforeEach(() => {
    mockInvokeSnap = vi.fn();
    global.fetch = vi.fn();
  });

  describe('Critical Issue #1: Hardcoded Network Override', () => {
    it('should NOT override network parameter to testnet', async () => {
      const params = {
        address: 'HAddr123',
        amount: 100,
        token: '00',
        network: 'mainnet', // User wants mainnet
      };

      mockInvokeSnap.mockResolvedValueOnce({ txId: 'abc123' });

      await WalletServiceMethods.sendTransaction(mockInvokeSnap, params);

      // Verify the snap was called with mainnet, not testnet
      expect(mockInvokeSnap).toHaveBeenCalledWith({
        method: 'htr_sendTransaction',
        params: expect.objectContaining({
          network: 'mainnet', // Should preserve original network
        }),
      });
    });

    it('should respect testnet when explicitly passed', async () => {
      const params = {
        address: 'HAddr123',
        amount: 100,
        token: '00',
        network: 'testnet',
      };

      mockInvokeSnap.mockResolvedValueOnce({ txId: 'abc123' });

      await WalletServiceMethods.sendTransaction(mockInvokeSnap, params);

      expect(mockInvokeSnap).toHaveBeenCalledWith({
        method: 'htr_sendTransaction',
        params: expect.objectContaining({
          network: 'testnet',
        }),
      });
    });

    it('should respect dev-testnet when explicitly passed', async () => {
      const params = {
        address: 'HAddr123',
        amount: 100,
        token: '00',
        network: 'dev-testnet',
      };

      mockInvokeSnap.mockResolvedValueOnce({ txId: 'abc123' });

      await WalletServiceMethods.sendTransaction(mockInvokeSnap, params);

      expect(mockInvokeSnap).toHaveBeenCalledWith({
        method: 'htr_sendTransaction',
        params: expect.objectContaining({
          network: 'dev-testnet',
        }),
      });
    });
  });

  describe('Critical Issue #2: Silent Transaction History Failures', () => {
    it('should throw error instead of returning empty array on fetch failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      // Should throw instead of silently returning []
      await expect(
        WalletServiceMethods.getTransactionHistory('HAddr123', 'mainnet')
      ).rejects.toThrow();
    });

    it('should throw error on network failures', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network timeout'));

      await expect(
        WalletServiceMethods.getTransactionHistory('HAddr123', 'mainnet')
      ).rejects.toThrow('Network timeout');
    });

    it('should throw error on invalid JSON response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      });

      await expect(
        WalletServiceMethods.getTransactionHistory('HAddr123', 'mainnet')
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

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockHistory),
      });

      const result = await WalletServiceMethods.getTransactionHistory('HAddr123', 'mainnet');

      expect(result).toHaveLength(1);
      expect(result[0].txId).toBe('abc123'); // Changed from tx_id to txId (camelCase)
      expect(result[0].timestamp).toBe(1000000); // Converted to milliseconds
    });
  });

  describe('Critical Issue #3: sendTransaction Error Handling', () => {
    it('should distinguish user rejection from other errors', async () => {
      // User rejected transaction (snap returns null)
      mockInvokeSnap.mockResolvedValueOnce(null);

      await expect(
        WalletServiceMethods.sendTransaction(mockInvokeSnap, {
          address: 'HAddr123',
          amount: 100,
          token: '00',
          network: 'testnet',
        })
      ).rejects.toThrow(/cancel|reject/i);
    });

    it('should handle snap errors gracefully', async () => {
      mockInvokeSnap.mockRejectedValueOnce(new Error('Insufficient funds'));

      await expect(
        WalletServiceMethods.sendTransaction(mockInvokeSnap, {
          address: 'HAddr123',
          amount: 100,
          token: '00',
          network: 'testnet',
        })
      ).rejects.toThrow('Insufficient funds');
    });

    it('should propagate error code 4001 (user rejection)', async () => {
      const rejectionError = new Error('User rejected');
      (rejectionError as any).code = 4001;
      mockInvokeSnap.mockRejectedValueOnce(rejectionError);

      await expect(
        WalletServiceMethods.sendTransaction(mockInvokeSnap, {
          address: 'HAddr123',
          amount: 100,
          token: '00',
          network: 'testnet',
        })
      ).rejects.toThrow('User rejected');
    });

    it('should successfully send transaction when snap returns valid response', async () => {
      const mockResponse = { txId: 'abc123', success: true };
      mockInvokeSnap.mockResolvedValueOnce(mockResponse);

      const result = await WalletServiceMethods.sendTransaction(mockInvokeSnap, {
        address: 'HAddr123',
        amount: 100,
        token: '00',
        network: 'testnet',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Critical Issue #4: getBalance Silent Failures', () => {
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
        { token: '00', available: 10000, locked: 500 },
      ];
      // The snap returns { response: [...] } format
      mockInvokeSnap.mockResolvedValueOnce({ response: mockBalance });

      const result = await WalletServiceMethods.getBalance(mockInvokeSnap);

      expect(result).toEqual(mockBalance);
    });
  });
});
