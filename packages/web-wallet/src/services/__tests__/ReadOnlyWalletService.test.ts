import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ReadOnlyWalletService } from '../ReadOnlyWalletService';
import type { HathorWalletServiceWallet } from '@hathor/wallet-lib';

// Mock wallet-lib
vi.mock('@hathor/wallet-lib', () => ({
  HathorWalletServiceWallet: vi.fn(),
  Network: vi.fn().mockImplementation((name) => ({ name })), // Network needs to be a proper constructor
  config: {
    setWalletServiceBaseUrl: vi.fn(),
    setWalletServiceBaseWsUrl: vi.fn(), // Fixed: was setWalletServiceWsUrl
    getNetwork: vi.fn(() => ({ name: 'testnet' })),
    getWalletServiceBaseUrl: vi.fn(() => 'https://wallet-service.testnet.hathor.network/'),
  },
}));

describe('ReadOnlyWalletService - Critical Issues', () => {
  let service: ReadOnlyWalletService;
  let mockWallet: any;

  beforeEach(async () => {
    service = new ReadOnlyWalletService();

    // Create mock wallet
    mockWallet = {
      isReady: vi.fn().mockReturnValue(false),
      startReadOnly: vi.fn().mockResolvedValue(undefined), // Read-only wallets use startReadOnly, not start
      stop: vi.fn().mockResolvedValue(undefined),
      getBalance: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      removeAllListeners: vi.fn(),
      getTxHistory: vi.fn().mockResolvedValue([]),
      getAddressAtIndex: vi.fn().mockResolvedValue({ address: 'HAddr123', index: 0 }),
      getCurrentAddress: vi.fn().mockReturnValue({ address: 'HAddrCurrent', index: 0 }),
      isAddressMine: vi.fn().mockResolvedValue(true),
      getUtxos: vi.fn().mockResolvedValue([]),
    };

    // Mock HathorWalletServiceWallet constructor
    const { HathorWalletServiceWallet } = await import('@hathor/wallet-lib');
    (HathorWalletServiceWallet as any).mockReturnValue(mockWallet);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Critical Issue #1: Concurrent Initialization Protection', () => {
    it('should prevent concurrent initialization calls', async () => {
      const xpub = 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egp'.repeat(2);

      // Start first initialization (don't await yet)
      const init1Promise = service.initialize(xpub, 'testnet');

      // Try to initialize again while first is in progress
      const init2Promise = service.initialize(xpub, 'testnet');

      // Second call should be rejected
      await expect(init2Promise).rejects.toThrow('already initializing');

      // First should succeed
      await expect(init1Promise).resolves.toBeUndefined();
    });

    it('should reset isInitializing flag when initialization fails', async () => {
      const xpub = 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egp'.repeat(2);

      // Make startReadOnly() fail
      mockWallet.startReadOnly.mockRejectedValueOnce(new Error('Network error'));

      // First attempt should fail
      await expect(service.initialize(xpub, 'testnet')).rejects.toThrow('Network error');

      // Second attempt should be allowed (flag should be reset)
      mockWallet.startReadOnly.mockResolvedValueOnce(undefined);
      await expect(service.initialize(xpub, 'testnet')).resolves.toBeUndefined();
    });

    it('should handle race condition where isReady becomes true during init', async () => {
      const xpub = 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egp'.repeat(2);

      // First init succeeds
      await service.initialize(xpub, 'testnet');
      mockWallet.isReady.mockReturnValue(true);

      // Second init should return early without throwing
      await expect(service.initialize(xpub, 'testnet')).resolves.toBeUndefined();

      // startReadOnly() should only be called once
      expect(mockWallet.startReadOnly).toHaveBeenCalledTimes(1);
    });
  });

  describe('Critical Issue #2: Network URL Mapping Logic', () => {
    it('should map dev-testnet to correct wallet-service URLs', async () => {
      const { config } = await import('@hathor/wallet-lib');
      const xpub = 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egp'.repeat(2);

      await service.initialize(xpub, 'dev-testnet');

      // Should set dev-testnet URLs
      expect(config.setWalletServiceBaseUrl).toHaveBeenCalledWith(
        expect.stringContaining('dev-testnet')
      );
      expect(config.setWalletServiceWsUrl).toHaveBeenCalledWith(
        expect.stringContaining('dev-testnet')
      );
    });

    it('should map mainnet correctly', async () => {
      const { config } = await import('@hathor/wallet-lib');
      const xpub = 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egp'.repeat(2);

      await service.initialize(xpub, 'mainnet');

      expect(config.setWalletServiceBaseUrl).toHaveBeenCalledWith(
        expect.stringContaining('mainnet')
      );
    });

    it('should handle invalid network names by defaulting to mainnet', async () => {
      const { config } = await import('@hathor/wallet-lib');
      const xpub = 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egp'.repeat(2);

      // @ts-expect-error - testing invalid input
      await service.initialize(xpub, 'invalid-network');

      // Should fall back to mainnet
      expect(config.setWalletServiceBaseUrl).toHaveBeenCalledWith(
        expect.stringContaining('mainnet')
      );
    });
  });

  describe('Critical Issue #3: wallet-already-loaded Error Handling', () => {
    it('should treat wallet-already-loaded as success for read-only mode', async () => {
      const xpub = 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egp'.repeat(2);

      // Mock wallet-service returning "already loaded" error
      mockWallet.startReadOnly.mockRejectedValueOnce({
        response: { data: { error: 'wallet-already-loaded' } }
      });

      // Should not throw
      await expect(service.initialize(xpub, 'testnet')).resolves.toBeUndefined();

      // Wallet should still be usable
      expect(service.getWallet()).toBe(mockWallet);
    });

    it('should throw on other 400 errors that are not wallet-already-loaded', async () => {
      const xpub = 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egp'.repeat(2);

      mockWallet.startReadOnly.mockRejectedValueOnce({
        response: { data: { error: 'invalid-xpub' } }
      });

      await expect(service.initialize(xpub, 'testnet')).rejects.toThrow();
    });

    it('should throw on network errors during start', async () => {
      const xpub = 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egp'.repeat(2);

      mockWallet.startReadOnly.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(service.initialize(xpub, 'testnet')).rejects.toThrow('Network timeout');
    });
  });

  describe('Critical Issue #4: Balance Transformation Logic', () => {
    beforeEach(async () => {
      const xpub = 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egp'.repeat(2);
      await service.initialize(xpub, 'testnet');
    });

    it('should handle missing balance fields gracefully', async () => {
      // Mock wallet returning undefined balance
      mockWallet.getBalance.mockResolvedValueOnce({
        '00': { balance: undefined }
      });

      const balance = await service.getBalance();

      expect(balance[0]).toEqual({
        token: '00',
        available: 0,
        locked: 0
      });
    });

    it('should correctly transform wallet-lib balance format', async () => {
      mockWallet.getBalance.mockResolvedValueOnce({
        '00': { balance: { unlocked: 10000, locked: 500 } },
        'abc123': { balance: { unlocked: 2000, locked: 100 } }
      });

      const balance = await service.getBalance();

      expect(balance).toHaveLength(2);
      expect(balance[0]).toEqual({
        token: '00',
        available: 10000,
        locked: 500
      });
      expect(balance[1]).toEqual({
        token: 'abc123',
        available: 2000,
        locked: 100
      });
    });

    it('should filter by token ID when provided', async () => {
      mockWallet.getBalance.mockResolvedValueOnce({
        '00': { balance: { unlocked: 10000, locked: 500 } },
        'abc123': { balance: { unlocked: 2000, locked: 100 } }
      });

      const balance = await service.getBalance('00');

      expect(balance).toHaveLength(1);
      expect(balance[0].token).toBe('00');
    });

    it('should handle null/undefined locked balance', async () => {
      mockWallet.getBalance.mockResolvedValueOnce({
        '00': { balance: { unlocked: 10000, locked: null } }
      });

      const balance = await service.getBalance();

      expect(balance[0].locked).toBe(0);
    });
  });

  describe('Critical Issue #5: Stop/Cleanup Race Conditions', () => {
    it('should safely handle stop() called multiple times', async () => {
      const xpub = 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egp'.repeat(2);
      await service.initialize(xpub, 'testnet');

      await service.stop();
      await service.stop(); // Should not throw

      expect(service.getWallet()).toBeNull();
    });

    it('should clear wallet reference even if wallet.stop() throws', async () => {
      const xpub = 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egp'.repeat(2);
      await service.initialize(xpub, 'testnet');

      mockWallet.stop.mockRejectedValueOnce(new Error('Network error'));

      // Should throw the error
      await expect(service.stop()).rejects.toThrow('Network error');

      // But wallet should still be cleared
      expect(service.getWallet()).toBeNull();
    });

    it('should remove all event listeners when stopping', async () => {
      const xpub = 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egp'.repeat(2);
      await service.initialize(xpub, 'testnet');

      await service.stop();

      expect(mockWallet.removeAllListeners).toHaveBeenCalled();
    });

    it('should allow re-initialization after stop', async () => {
      const xpub = 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egp'.repeat(2);

      await service.initialize(xpub, 'testnet');
      await service.stop();

      // Should be able to initialize again
      mockWallet.isReady.mockReturnValue(false);
      await expect(service.initialize(xpub, 'testnet')).resolves.toBeUndefined();

      expect(mockWallet.startReadOnly).toHaveBeenCalledTimes(2);
    });
  });

  describe('Important Issue: getCurrentAddress should throw on error', () => {
    it('should throw error instead of returning null on failure', async () => {
      const xpub = 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egp'.repeat(2);
      await service.initialize(xpub, 'testnet');

      mockWallet.getAddressAtIndex.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getCurrentAddress()).rejects.toThrow('Network error');
    });
  });

  describe('Critical Issue: isAddressMine should throw on error', () => {
    it('should throw error instead of returning false on failure', async () => {
      const xpub = 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egp'.repeat(2);
      await service.initialize(xpub, 'testnet');

      mockWallet.isAddressMine.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.isAddressMine('HAddr123')).rejects.toThrow('Network error');
    });

    it('should correctly return true when address is mine', async () => {
      const xpub = 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egp'.repeat(2);
      await service.initialize(xpub, 'testnet');

      mockWallet.isAddressMine.mockResolvedValueOnce(true);

      const result = await service.isAddressMine('HAddr123');
      expect(result).toBe(true);
    });

    it('should correctly return false when address is not mine', async () => {
      const xpub = 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egp'.repeat(2);
      await service.initialize(xpub, 'testnet');

      mockWallet.isAddressMine.mockResolvedValueOnce(false);

      const result = await service.isAddressMine('HAddrOther');
      expect(result).toBe(false);
    });
  });
});
