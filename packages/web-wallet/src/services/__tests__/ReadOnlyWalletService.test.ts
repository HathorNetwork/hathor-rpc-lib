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
  mockGetUtxos,
  mockGetTokens,
  mockSetWalletServiceBaseUrl,
  mockSetWalletServiceBaseWsUrl,
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
  mockGetUtxos: vi.fn(),
  mockGetTokens: vi.fn(),
  mockSetWalletServiceBaseUrl: vi.fn(),
  mockSetWalletServiceBaseWsUrl: vi.fn(),
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
    getUtxos = mockGetUtxos;
    getTokens = mockGetTokens;
  }

  return {
    HathorWalletServiceWallet: MockHathorWalletServiceWallet,
    Network: MockNetwork,
    config: {
      setWalletServiceBaseUrl: mockSetWalletServiceBaseUrl,
      setWalletServiceBaseWsUrl: mockSetWalletServiceBaseWsUrl,
    },
    constants: {
      NATIVE_TOKEN_UID: '00',
      DECIMAL_PLACES: 2,
    },
  };
});

import { ReadOnlyWalletService } from '../ReadOnlyWalletService';

describe('ReadOnlyWalletService', () => {
  let service: ReadOnlyWalletService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ReadOnlyWalletService();
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

    it('should set up event listeners on the wallet', async () => {
      mockIsReady.mockReturnValue(true);

      await service.initialize('xpub123', 'testnet');

      expect(mockOn).toHaveBeenCalledWith('state', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('new-tx', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('update-tx', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('reload-data', expect.any(Function));
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
      mockGetBalance.mockResolvedValue({
        '00': { balance: { unlocked: 1000, locked: 500 } },
        'token123': { balance: { unlocked: 200, locked: 0 } },
      });

      const balances = await service.getBalance();

      expect(balances).toHaveLength(2);
      expect(balances).toContainEqual({
        token: '00',
        available: 1000n,
        locked: 500n,
      });
      expect(balances).toContainEqual({
        token: 'token123',
        available: 200n,
        locked: 0n,
      });
    });

    it('should handle missing balance fields', async () => {
      mockGetBalance.mockResolvedValue({
        '00': { balance: {} },
      });

      const balances = await service.getBalance();

      expect(balances[0]).toEqual({
        token: '00',
        available: 0n,
        locked: 0n,
      });
    });

    it('should pass tokenId filter to wallet-lib', async () => {
      mockGetBalance.mockResolvedValue({});

      await service.getBalance('specific-token');

      expect(mockGetBalance).toHaveBeenCalledWith('specific-token');
    });

    it('should throw when wallet not initialized', async () => {
      const uninitializedService = new ReadOnlyWalletService();

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
      const uninitializedService = new ReadOnlyWalletService();

      expect(() => uninitializedService.getCurrentAddress()).toThrow('Wallet not initialized');
    });

    it('should propagate errors from wallet-lib', () => {
      mockGetCurrentAddress.mockImplementation(() => {
        throw new Error('Address derivation failed');
      });

      expect(() => service.getCurrentAddress()).toThrow('Address derivation failed');
    });
  });

  describe('getNextAddress', () => {
    beforeEach(async () => {
      mockIsReady.mockReturnValue(true);
      await service.initialize('xpub123', 'testnet');
    });

    it('should mark current address as used and return next', () => {
      mockGetCurrentAddress
        .mockReturnValueOnce({ address: 'HAddr1', index: 0 }) // markAsUsed call
        .mockReturnValueOnce({ address: 'HAddr2', index: 1 }); // get next call

      const result = service.getNextAddress();

      expect(mockGetCurrentAddress).toHaveBeenCalledWith({ markAsUsed: true });
      expect(result).toEqual({
        address: 'HAddr2',
        index: 1,
        transactions: 0,
      });
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

  describe('getUtxos', () => {
    beforeEach(async () => {
      mockIsReady.mockReturnValue(true);
      await service.initialize('xpub123', 'testnet');
    });

    it('should convert bigint options to numbers for wallet-lib', async () => {
      mockGetUtxos.mockResolvedValue([]);

      await service.getUtxos({
        token: '00',
        amount_bigger_than: 1000n,
        amount_smaller_than: 5000n,
      });

      expect(mockGetUtxos).toHaveBeenCalledWith({
        token: '00',
        amount_bigger_than: 1000,
        amount_smaller_than: 5000,
      });
    });
  });

  describe('stop', () => {
    beforeEach(async () => {
      mockIsReady.mockReturnValue(true);
      await service.initialize('xpub123', 'testnet');
    });

    it('should remove listeners and stop wallet', async () => {
      await service.stop();

      expect(mockRemoveAllListeners).toHaveBeenCalled();
      expect(mockStop).toHaveBeenCalled();
      expect(service.isReady()).toBe(false);
    });

    it('should clear wallet reference even when stop throws', async () => {
      mockStop.mockRejectedValue(new Error('Stop failed'));

      await expect(service.stop()).rejects.toThrow('Wallet stop had 1 error(s)');

      expect(service.isReady()).toBe(false);
    });

    it('should aggregate multiple errors during stop', async () => {
      mockRemoveAllListeners.mockImplementation(() => {
        throw new Error('Listener error');
      });
      mockStop.mockRejectedValue(new Error('Stop error'));

      await expect(service.stop()).rejects.toThrow('Wallet stop had 2 error(s)');
      expect(service.isReady()).toBe(false);
    });

    it('should be safe to call stop when not initialized', async () => {
      const uninitializedService = new ReadOnlyWalletService();

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
      const uninitializedService = new ReadOnlyWalletService();
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
