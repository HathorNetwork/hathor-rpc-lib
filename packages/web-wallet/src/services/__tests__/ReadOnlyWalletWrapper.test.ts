import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create hoisted mock functions that will be available during mock hoisting
const {
  mockIsReady,
  mockStartReadOnly,
  mockStop,
  mockOn,
  mockOff,
  mockRemoveAllListeners,
  mockGetBalance,
  mockGetTxHistory,
  mockGetCurrentAddress,
  mockGetAddressAtIndex,
  mockGetAllAddresses,
  mockIsAddressMine,
  mockGetTokens,
  mockHasTxOutsideFirstAddress,
  mockSetWalletServiceBaseUrl,
  mockSetWalletServiceBaseWsUrl,
  mockSetNetwork,
} = vi.hoisted(() => ({
  mockIsReady: vi.fn(),
  mockStartReadOnly: vi.fn(),
  mockStop: vi.fn(),
  mockOn: vi.fn(),
  mockOff: vi.fn(),
  mockRemoveAllListeners: vi.fn(),
  mockGetBalance: vi.fn(),
  mockGetTxHistory: vi.fn(),
  mockGetCurrentAddress: vi.fn(),
  mockGetAddressAtIndex: vi.fn(),
  mockGetAllAddresses: vi.fn(),
  mockIsAddressMine: vi.fn(),
  mockGetTokens: vi.fn(),
  mockHasTxOutsideFirstAddress: vi.fn(),
  mockSetWalletServiceBaseUrl: vi.fn(),
  mockSetWalletServiceBaseWsUrl: vi.fn(),
  mockSetNetwork: vi.fn(),
}));

vi.mock('@hathor/wallet-lib', () => {
  // Mock Network class
  class MockNetwork {
    name: string;
    constructor(name: string) {
      this.name = name;
    }
  }

  // Mock wallet class
  class MockHathorWalletServiceWallet {
    isReady = mockIsReady;
    startReadOnly = mockStartReadOnly;
    stop = mockStop;
    on = mockOn;
    off = mockOff;
    removeAllListeners = mockRemoveAllListeners;
    getBalance = mockGetBalance;
    getTxHistory = mockGetTxHistory;
    getCurrentAddress = mockGetCurrentAddress;
    getAddressAtIndex = mockGetAddressAtIndex;
    getAllAddresses = mockGetAllAddresses;
    isAddressMine = mockIsAddressMine;
    getTokens = mockGetTokens;
    hasTxOutsideFirstAddress = mockHasTxOutsideFirstAddress;
  }

  // Mock error classes
  class MockXPubError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'XPubError';
    }
  }

  class MockWalletError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'WalletError';
    }
  }

  class MockUninitializedWalletError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'UninitializedWalletError';
    }
  }

  return {
    HathorWalletServiceWallet: MockHathorWalletServiceWallet,
    Network: MockNetwork,
    config: {
      setWalletServiceBaseUrl: mockSetWalletServiceBaseUrl,
      setWalletServiceBaseWsUrl: mockSetWalletServiceBaseWsUrl,
      setNetwork: mockSetNetwork,
    },
    constants: {
      NATIVE_TOKEN_UID: '00',
      DECIMAL_PLACES: 2,
    },
    errors: {
      XPubError: MockXPubError,
      WalletError: MockWalletError,
      UninitializedWalletError: MockUninitializedWalletError,
    },
  };
});

import { ReadOnlyWalletWrapper } from '../ReadOnlyWalletWrapper';

describe('ReadOnlyWalletWrapper', () => {
  let service: ReadOnlyWalletWrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ReadOnlyWalletWrapper();
    mockIsReady.mockReturnValue(false);
    mockStartReadOnly.mockResolvedValue(undefined);
    mockStop.mockResolvedValue(undefined);
  });

  describe('initialize', () => {
    it('should initialize wallet with correct network configuration for testnet', async () => {
      mockIsReady.mockReturnValue(true);

      await service.initialize('xpub123', 'testnet');

      expect(mockSetWalletServiceBaseUrl).toHaveBeenCalledWith(
        expect.stringContaining('testnet')
      );
      expect(mockSetWalletServiceBaseWsUrl).toHaveBeenCalledWith(
        expect.stringContaining('testnet')
      );
      expect(mockStartReadOnly).toHaveBeenCalled();
    });

    it('should initialize wallet with mainnet configuration by default', async () => {
      mockIsReady.mockReturnValue(true);

      await service.initialize('xpub123', 'mainnet');

      // Mainnet URL is https://wallet-service.hathor.network/ (no "mainnet" in URL)
      expect(mockSetWalletServiceBaseUrl).toHaveBeenCalledWith(
        'https://wallet-service.hathor.network/'
      );
      expect(mockStartReadOnly).toHaveBeenCalled();
    });

    it('should throw when already initializing', async () => {
      mockStartReadOnly.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const firstInit = service.initialize('xpub123', 'testnet');

      await expect(service.initialize('xpub123', 'testnet')).rejects.toThrow(
        'Wallet is already initializing'
      );

      await firstInit.catch(() => {});
    });

    it('should reset initializing flag on error', async () => {
      mockStartReadOnly.mockRejectedValue(new Error('Connection failed'));

      await expect(service.initialize('xpub123', 'testnet')).rejects.toThrow('Connection failed');

      // Should be able to try again
      mockStartReadOnly.mockResolvedValue(undefined);
      mockIsReady.mockReturnValue(true);
      await service.initialize('xpub123', 'testnet');

      expect(service.isReady()).toBe(true);
    });

    it('should handle wallet-already-loaded error gracefully', async () => {
      mockStartReadOnly.mockRejectedValue({
        response: { data: { error: 'wallet-already-loaded' } },
      });
      mockIsReady.mockReturnValue(true);

      await service.initialize('xpub123', 'testnet');

      expect(service.isReady()).toBe(true);
    });

    it('should skip initialization if wallet is already ready', async () => {
      mockIsReady.mockReturnValue(true);
      await service.initialize('xpub123', 'testnet');

      vi.clearAllMocks();
      mockIsReady.mockReturnValue(true);

      await service.initialize('xpub123', 'testnet');

      expect(mockStartReadOnly).not.toHaveBeenCalled();
    });
  });

  describe('getBalance', () => {
    beforeEach(async () => {
      mockIsReady.mockReturnValue(true);
      await service.initialize('xpub123', 'testnet');
    });

    it('should return transformed balance data', async () => {
      mockGetBalance.mockResolvedValue([
        { token: { id: '00' }, balance: { unlocked: 1000, locked: 500 } },
        { token: { id: 'token123' }, balance: { unlocked: 200, locked: 0 } },
      ]);

      const balances = await service.getBalance();

      expect(balances.size).toBe(2);
      expect(balances.get('00')).toEqual({
        token: '00',
        available: 1000n,
        locked: 500n,
      });
      expect(balances.get('token123')).toEqual({
        token: 'token123',
        available: 200n,
        locked: 0n,
      });
    });

    it('should handle missing balance fields', async () => {
      mockGetBalance.mockResolvedValue([
        { token: { id: '00' }, balance: {} },
      ]);

      const balances = await service.getBalance();

      expect(balances.get('00')).toEqual({
        token: '00',
        available: 0n,
        locked: 0n,
      });
    });

    it('should pass tokenId filter to wallet-lib', async () => {
      mockGetBalance.mockResolvedValue([]);

      await service.getBalance('specific-token');

      expect(mockGetBalance).toHaveBeenCalledWith('specific-token');
    });

    it('should throw when wallet is null', async () => {
      const uninitializedService = new ReadOnlyWalletWrapper();

      await expect(uninitializedService.getBalance()).rejects.toThrow('Wallet not initialized');
    });
  });

  describe('getTransactionHistory', () => {
    beforeEach(async () => {
      mockIsReady.mockReturnValue(true);
      await service.initialize('xpub123', 'testnet');
    });

    it('should transform transaction history correctly', async () => {
      mockGetTxHistory.mockResolvedValue([
        { txId: 'tx1', timestamp: 1234567890, balance: 100, voided: false },
        { txId: 'tx2', timestamp: 1234567891, balance: -50, voided: true },
      ]);

      const history = await service.getTransactionHistory(10, 0, '00');

      expect(history).toEqual([
        { tx_id: 'tx1', timestamp: 1234567890, balance: 100n, is_voided: false },
        { tx_id: 'tx2', timestamp: 1234567891, balance: -50n, is_voided: true },
      ]);
    });

    it('should pass pagination parameters correctly', async () => {
      mockGetTxHistory.mockResolvedValue([]);

      await service.getTransactionHistory(25, 10, 'custom-token');

      expect(mockGetTxHistory).toHaveBeenCalledWith({
        token_id: 'custom-token',
        count: 25,
        skip: 10,
      });
    });
  });

  describe('getCurrentAddress', () => {
    beforeEach(async () => {
      mockIsReady.mockReturnValue(true);
      await service.initialize('xpub123', 'testnet');
    });

    it('should return address info', () => {
      mockGetCurrentAddress.mockReturnValue({
        address: 'HAddr123',
        index: 5,
      });

      const result = service.getCurrentAddress();

      expect(result).toEqual({
        address: 'HAddr123',
        index: 5,
        transactions: 0,
      });
    });

    it('should throw when wallet not initialized', () => {
      const uninitializedService = new ReadOnlyWalletWrapper();

      expect(() => uninitializedService.getCurrentAddress()).toThrow('Wallet not initialized');
    });

    it('should propagate errors from wallet-lib', () => {
      mockGetCurrentAddress.mockImplementation(() => {
        throw new Error('Address derivation failed');
      });

      expect(() => service.getCurrentAddress()).toThrow('Address derivation failed');
    });
  });

  describe('getAddressAtIndex', () => {
    beforeEach(async () => {
      mockIsReady.mockReturnValue(true);
      await service.initialize('xpub123', 'testnet');
    });

    it('should return address at specified index', async () => {
      mockGetAddressAtIndex.mockResolvedValue('HAddrAtIndex10');

      const result = await service.getAddressAtIndex(10);

      expect(mockGetAddressAtIndex).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        address: 'HAddrAtIndex10',
        index: 10,
        transactions: 0,
      });
    });
  });

  describe('isAddressMine', () => {
    beforeEach(async () => {
      mockIsReady.mockReturnValue(true);
      await service.initialize('xpub123', 'testnet');
    });

    it('should return true for owned address', async () => {
      mockIsAddressMine.mockResolvedValue(true);

      const result = await service.isAddressMine('HMyAddr');

      expect(result).toBe(true);
      expect(mockIsAddressMine).toHaveBeenCalledWith('HMyAddr');
    });

    it('should return false for non-owned address', async () => {
      mockIsAddressMine.mockResolvedValue(false);

      const result = await service.isAddressMine('HNotMyAddr');

      expect(result).toBe(false);
    });

    it('should propagate errors instead of returning false', async () => {
      mockIsAddressMine.mockRejectedValue(new Error('Network error'));

      await expect(service.isAddressMine('HAddr')).rejects.toThrow('Network error');
    });
  });

  describe('hasTxOutsideFirstAddress', () => {
    beforeEach(async () => {
      mockIsReady.mockReturnValue(true);
      await service.initialize('xpub123', 'testnet');
    });

    it('should return true when wallet has transactions outside first address', async () => {
      mockHasTxOutsideFirstAddress.mockResolvedValue(true);

      const result = await service.hasTxOutsideFirstAddress();

      expect(result).toBe(true);
      expect(mockHasTxOutsideFirstAddress).toHaveBeenCalled();
    });

    it('should return false when wallet has no transactions outside first address', async () => {
      mockHasTxOutsideFirstAddress.mockResolvedValue(false);

      const result = await service.hasTxOutsideFirstAddress();

      expect(result).toBe(false);
    });

    it('should throw error when wallet is not initialized', async () => {
      const uninitializedService = new ReadOnlyWalletWrapper();

      await expect(uninitializedService.hasTxOutsideFirstAddress()).rejects.toThrow('Wallet not initialized');
    });

    it('should propagate errors from wallet-lib', async () => {
      mockHasTxOutsideFirstAddress.mockRejectedValue(new Error('Network error'));

      await expect(service.hasTxOutsideFirstAddress()).rejects.toThrow('Network error');
    });
  });

  describe('stop', () => {
    beforeEach(async () => {
      mockIsReady.mockReturnValue(true);
      await service.initialize('xpub123', 'testnet');
    });

    it('should stop wallet and clear reference', async () => {
      await service.stop();

      expect(mockStop).toHaveBeenCalled();
      expect(service.isReady()).toBe(false);
    });

    it('should clear wallet reference even when stop throws', async () => {
      mockStop.mockRejectedValue(new Error('Stop failed'));

      await expect(service.stop()).rejects.toThrow('Stop failed');

      expect(service.isReady()).toBe(false);
    });

    it('should be safe to call stop when not initialized', async () => {
      const uninitializedService = new ReadOnlyWalletWrapper();

      await expect(uninitializedService.stop()).resolves.toBeUndefined();
    });
  });

  describe('event handling', () => {
    beforeEach(async () => {
      mockIsReady.mockReturnValue(true);
      mockRemoveAllListeners.mockReset(); // Reset any previous mock implementations
      await service.initialize('xpub123', 'testnet');
      vi.clearAllMocks();
    });

    it('should register event listeners via on()', () => {
      const callback = vi.fn();
      service.on('new-tx', callback);

      expect(mockOn).toHaveBeenCalledWith('new-tx', callback);
    });

    it('should remove event listeners via off()', () => {
      const callback = vi.fn();
      service.off('new-tx', callback);

      expect(mockOff).toHaveBeenCalledWith('new-tx', callback);
    });

    it('should remove all listeners via removeAllListeners()', () => {
      service.removeAllListeners();

      expect(mockRemoveAllListeners).toHaveBeenCalled();
    });

    it('should not throw when calling event methods on uninitialized service', () => {
      const uninitializedService = new ReadOnlyWalletWrapper();
      const callback = vi.fn();

      expect(() => uninitializedService.on('event', callback)).not.toThrow();
      expect(() => uninitializedService.off('event', callback)).not.toThrow();
      expect(() => uninitializedService.removeAllListeners()).not.toThrow();
    });
  });

  describe('getWallet', () => {
    it('should return null when not initialized', () => {
      expect(service.getWallet()).toBeNull();
    });

    it('should return wallet instance after initialization', async () => {
      mockIsReady.mockReturnValue(true);
      await service.initialize('xpub123', 'testnet');

      expect(service.getWallet()).not.toBeNull();
    });
  });
});
