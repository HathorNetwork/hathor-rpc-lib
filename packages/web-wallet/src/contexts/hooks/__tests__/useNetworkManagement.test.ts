import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkManagement } from '../useNetworkManagement';
import { SnapUnauthorizedError } from '../../../services/SnapService';
import type { AddressMode } from '../../../utils/addressMode';
import type { WalletBalance } from '../../../types/wallet';

// Hoisted mocks
const {
  mockReadOnlyWalletWrapper,
  mockLoadTokensWithBalances,
  mockGetAddressForMode,
  mockRaceWithTimeout,
} = vi.hoisted(() => ({
  mockReadOnlyWalletWrapper: {
    initialize: vi.fn(),
    stop: vi.fn(),
    isReady: vi.fn(() => true),
    getBalance: vi.fn(),
  },
  mockLoadTokensWithBalances: vi.fn(),
  mockGetAddressForMode: vi.fn(),
  mockRaceWithTimeout: vi.fn((promise) => promise),
}));

vi.mock('../../../services/ReadOnlyWalletWrapper', () => ({
  readOnlyWalletWrapper: mockReadOnlyWalletWrapper,
}));

vi.mock('../../../utils/tokenLoading', () => ({
  loadTokensWithBalances: mockLoadTokensWithBalances,
}));

vi.mock('../../../utils/addressMode', () => ({
  getAddressForMode: mockGetAddressForMode,
}));

vi.mock('../../../utils/promise', () => ({
  raceWithTimeout: mockRaceWithTimeout,
}));

vi.mock('../../../utils/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('../../../utils/snapErrors', () => ({
  isSnapCrashedError: (msg: string) =>
    msg.includes('DataCloneError') ||
    msg.includes('postMessage') ||
    msg.includes('cloned') ||
    msg.includes('timeout'),
}));

describe('useNetworkManagement', () => {
  const mockInvokeSnap = vi.fn();
  const mockOnSetupEventListeners = vi.fn();
  const mockOnSnapError = vi.fn();
  const mockOnNetworkChange = vi.fn();
  const mockOnLoadingChange = vi.fn();
  const mockOnError = vi.fn();
  const mockOnForceDisconnect = vi.fn();
  const mockStopWallet = vi.fn();
  const mockReinitializeWallet = vi.fn();

  const defaultOptions = {
    isConnected: true,
    xpub: 'xpub123',
    network: 'mainnet',
    address: 'HAddr123',
    balances: [{ token: '00', available: 1000n, locked: 0n }] as WalletBalance[],
    addressMode: 'first' as AddressMode,
    invokeSnap: mockInvokeSnap,
    onSetupEventListeners: mockOnSetupEventListeners,
    onSnapError: mockOnSnapError,
    onNetworkChange: mockOnNetworkChange,
    onLoadingChange: mockOnLoadingChange,
    onError: mockOnError,
    onForceDisconnect: mockOnForceDisconnect,
    stopWallet: mockStopWallet,
    reinitializeWallet: mockReinitializeWallet,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful mocks
    mockInvokeSnap.mockResolvedValue({ response: { success: true } });
    mockStopWallet.mockResolvedValue(undefined);
    mockReinitializeWallet.mockResolvedValue(undefined);
    mockGetAddressForMode.mockResolvedValue('HNewAddr456');
    mockReadOnlyWalletWrapper.getBalance.mockResolvedValue(
      new Map([['00', { token: '00', available: 2000n, locked: 0n }]])
    );
    mockLoadTokensWithBalances.mockResolvedValue({
      tokens: [],
      warning: null,
      failedTokens: [],
    });
  });

  describe('changeNetwork', () => {
    it('should do nothing when not connected', async () => {
      const { result } = renderHook(() =>
        useNetworkManagement({ ...defaultOptions, isConnected: false })
      );

      await act(async () => {
        await result.current.changeNetwork('testnet');
      });

      expect(mockInvokeSnap).not.toHaveBeenCalled();
    });

    it('should do nothing when xpub is null', async () => {
      const { result } = renderHook(() =>
        useNetworkManagement({ ...defaultOptions, xpub: null })
      );

      await act(async () => {
        await result.current.changeNetwork('testnet');
      });

      expect(mockInvokeSnap).not.toHaveBeenCalled();
    });

    it('should successfully change network', async () => {
      const { result } = renderHook(() => useNetworkManagement(defaultOptions));

      await act(async () => {
        await result.current.changeNetwork('testnet');
      });

      // Verify snap was called to change network
      expect(mockInvokeSnap).toHaveBeenCalledWith({
        method: 'htr_changeNetwork',
        params: { network: 'mainnet', newNetwork: 'testnet' },
      });

      // Verify wallet lifecycle
      expect(mockStopWallet).toHaveBeenCalled();
      expect(mockReinitializeWallet).toHaveBeenCalledWith('xpub123', 'testnet');

      // Verify event listeners were setup
      expect(mockOnSetupEventListeners).toHaveBeenCalled();

      // Verify state was updated
      expect(mockOnNetworkChange).toHaveBeenCalledWith(
        expect.objectContaining({
          network: 'testnet',
          address: 'HNewAddr456',
        })
      );

      // Verify loading states were managed
      expect(mockOnLoadingChange).toHaveBeenCalledWith(true, 'Changing network...');
      expect(mockOnLoadingChange).toHaveBeenCalledWith(false, '');
    });

    it('should show loading steps during network change', async () => {
      const { result } = renderHook(() => useNetworkManagement(defaultOptions));

      await act(async () => {
        await result.current.changeNetwork('testnet');
      });

      const loadingCalls = mockOnLoadingChange.mock.calls.map((call) => call[1]);
      expect(loadingCalls).toContain('Changing network...');
      expect(loadingCalls).toContain('Stopping previous wallet...');
      expect(loadingCalls).toContain('Initializing wallet on new network...');
      expect(loadingCalls).toContain('Loading wallet data...');
    });

    it('should handle SnapUnauthorizedError', async () => {
      mockInvokeSnap.mockRejectedValue(
        new SnapUnauthorizedError('Permission denied', 4100)
      );

      const { result } = renderHook(() => useNetworkManagement(defaultOptions));

      await act(async () => {
        await result.current.changeNetwork('testnet');
      });

      expect(mockOnSnapError).toHaveBeenCalled();
      expect(mockOnLoadingChange).toHaveBeenCalledWith(false, '');
    });

    it('should force disconnect on snap crash without rollback', async () => {
      mockInvokeSnap.mockRejectedValue(new Error('DataCloneError: Failed to clone'));

      const { result } = renderHook(() => useNetworkManagement(defaultOptions));

      await act(async () => {
        await result.current.changeNetwork('testnet');
      });

      // Should force disconnect, not rollback
      expect(mockOnForceDisconnect).toHaveBeenCalled();

      // Should show error about snap crash
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('MetaMask Snap may need to be reloaded')
      );
    });

    it('should rollback on non-crash failure', async () => {
      // First call (network change) fails
      mockInvokeSnap
        .mockRejectedValueOnce(new Error('Network initialization failed'))
        // Second call (rollback) succeeds
        .mockResolvedValueOnce({ response: { success: true } });

      const { result } = renderHook(() => useNetworkManagement(defaultOptions));

      await act(async () => {
        await result.current.changeNetwork('testnet');
      });

      // Should attempt rollback
      expect(mockInvokeSnap).toHaveBeenCalledTimes(2);
      expect(mockInvokeSnap).toHaveBeenLastCalledWith({
        method: 'htr_changeNetwork',
        params: { network: 'testnet', newNetwork: 'mainnet' },
      });

      // Should restore previous state
      expect(mockOnNetworkChange).toHaveBeenCalledWith(
        expect.objectContaining({
          network: 'mainnet',
          address: 'HAddr123',
        })
      );

      // Should show error with rollback info
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('Reverted to mainnet')
      );
    });

    it('should force disconnect when rollback also fails', async () => {
      // First call fails
      mockInvokeSnap.mockRejectedValueOnce(new Error('Change failed'));

      // Rollback also fails (via raceWithTimeout)
      mockRaceWithTimeout.mockRejectedValueOnce(new Error('Rollback timeout'));

      const { result } = renderHook(() => useNetworkManagement(defaultOptions));

      await act(async () => {
        await result.current.changeNetwork('testnet');
      });

      // Should force disconnect
      expect(mockOnForceDisconnect).toHaveBeenCalled();

      // Should show error about both failures
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('rollback also failed')
      );
    });

    it('should handle address fetch failure during network change', async () => {
      mockGetAddressForMode.mockRejectedValue(new Error('Address derivation failed'));

      const { result } = renderHook(() => useNetworkManagement(defaultOptions));

      await act(async () => {
        await result.current.changeNetwork('testnet');
      });

      // Should trigger rollback
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('Reverted to mainnet')
      );
    });

    it('should save network to localStorage only after successful change', async () => {
      const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem');

      const { result } = renderHook(() => useNetworkManagement(defaultOptions));

      await act(async () => {
        await result.current.changeNetwork('testnet');
      });

      // Should only save after state update
      expect(localStorageSpy).toHaveBeenCalledWith('hathor_wallet_network', 'testnet');

      localStorageSpy.mockRestore();
    });

    it('should not save network to localStorage on failure', async () => {
      const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem');
      mockInvokeSnap.mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useNetworkManagement(defaultOptions));

      await act(async () => {
        await result.current.changeNetwork('testnet');
      });

      // Should not save on failure
      expect(localStorageSpy).not.toHaveBeenCalledWith('hathor_wallet_network', 'testnet');

      localStorageSpy.mockRestore();
    });

    it('should handle ERR_NETWORK as snap crash', async () => {
      mockInvokeSnap.mockRejectedValue(new Error('ERR_NETWORK: Connection reset'));

      const { result } = renderHook(() => useNetworkManagement(defaultOptions));

      await act(async () => {
        await result.current.changeNetwork('testnet');
      });

      // Should force disconnect without rollback
      expect(mockOnForceDisconnect).toHaveBeenCalled();
    });

    it('should handle Network Error as snap crash', async () => {
      mockInvokeSnap.mockRejectedValue(new Error('Network Error'));

      const { result } = renderHook(() => useNetworkManagement(defaultOptions));

      await act(async () => {
        await result.current.changeNetwork('testnet');
      });

      // Should force disconnect without rollback
      expect(mockOnForceDisconnect).toHaveBeenCalled();
    });
  });
});
