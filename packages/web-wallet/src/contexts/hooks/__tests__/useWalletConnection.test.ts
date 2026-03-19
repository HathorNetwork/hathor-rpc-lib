import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Hoisted mocks
const {
  mockReadOnlyWalletWrapper,
  mockGetAddressForMode,
  mockRaceWithTimeout,
  mockDefaultSnapOrigin,
} = vi.hoisted(() => ({
  mockReadOnlyWalletWrapper: {
    initialize: vi.fn(),
    stop: vi.fn(),
    isReady: vi.fn(() => false),
    getBalance: vi.fn(),
    getAddressAtIndex: vi.fn(),
    removeAllListeners: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
  mockGetAddressForMode: vi.fn(),
  mockRaceWithTimeout: vi.fn((promise: Promise<unknown>) => promise),
  mockDefaultSnapOrigin: 'npm:@hathor/hathor-snap',
}));

vi.mock('../../../services/ReadOnlyWalletWrapper', () => ({
  readOnlyWalletWrapper: mockReadOnlyWalletWrapper,
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
  isSnapCrashedError: () => false,
  getSnapErrorUserMessage: () => 'Snap error',
}));

vi.mock('../../../errors/WalletConnectionErrors', () => ({
  ERROR_PATTERNS: {
    SNAP_CONNECTION_FAILED: 'Snap connection failed',
    SNAP_NOT_INSTALLED: 'Snap not installed',
    SNAP_BLOCKED: 'Snap blocked',
    SNAP_DISABLED: 'Snap disabled',
    ALREADY_INITIALIZING: 'Already initializing',
    WALLET_ALREADY_LOADED: 'wallet-already-loaded',
    AUTHENTICATION: 'authentication',
    ABORTED: 'aborted',
  },
  WalletLibErrors: {
    XPubError: class XPubError extends Error {},
    UninitializedWalletError: class UninitializedWalletError extends Error {},
  },
  PROVIDER_ERROR_CODES: {
    USER_REJECTED: 4001,
  },
  hasErrorCode: () => false,
}));

vi.mock('../../../services/SnapService', () => ({
  SnapUnauthorizedError: class SnapUnauthorizedError extends Error {
    code: number;
    constructor(message: string, code: number) {
      super(message);
      this.code = code;
    }
  },
}));

vi.mock('@hathor/snap-utils', () => ({
  defaultSnapOrigin: mockDefaultSnapOrigin,
}));

vi.mock('../../../constants', () => ({
  DEFAULT_NETWORK: 'mainnet',
  TOKEN_IDS: { HTR: '00' },
  CHECK_CONNECTION_TIMEOUT: 30000,
}));

vi.mock('../../../constants/timeouts', () => ({
  SNAP_TIMEOUTS: {
    NETWORK_CHECK: 5000,
    NETWORK_CHANGE: 10000,
    RPC_CALL: 10000,
  },
}));

import { useWalletConnection } from '../useWalletConnection';
import type { AddressMode } from '../../../utils/addressMode';

describe('useWalletConnection - checkExistingConnection network verification', () => {
  const mockInvokeSnap = vi.fn();
  const mockRequestSnap = vi.fn();
  const mockRequest = vi.fn();
  const mockOnError = vi.fn();
  const mockOnConnectionReady = vi.fn();
  const mockOnRefreshBalance = vi.fn();
  const mockOnRefreshBalanceForTokens = vi.fn();
  const mockOnShowConnectionLostModal = vi.fn();
  const mockOnNewTransaction = vi.fn();
  const mockOnTransactionEvent = vi.fn();

  const defaultOptions = {
    addressMode: 'first' as AddressMode,
    request: mockRequest,
    invokeSnap: mockInvokeSnap,
    requestSnap: mockRequestSnap,
    metamaskError: null,
    onRefreshBalance: mockOnRefreshBalance,
    onRefreshBalanceForTokens: mockOnRefreshBalanceForTokens,
    onError: mockOnError,
    onShowConnectionLostModal: mockOnShowConnectionLostModal,
    onNewTransaction: mockOnNewTransaction,
    onConnectionReady: mockOnConnectionReady,
    onTransactionEvent: mockOnTransactionEvent,
  };

  // Mock wallet_getSnaps response for verifySnapInstallation
  const mockSnapResponse = {
    [mockDefaultSnapOrigin]: {
      version: '0.4.1',
      enabled: true,
      blocked: false,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Default successful mock implementations
    mockRequestSnap.mockResolvedValue(undefined);
    mockReadOnlyWalletWrapper.initialize.mockResolvedValue(undefined);
    mockReadOnlyWalletWrapper.stop.mockResolvedValue(undefined);
    mockReadOnlyWalletWrapper.isReady.mockReturnValue(false);
    mockReadOnlyWalletWrapper.getBalance.mockResolvedValue(
      new Map([['00', { token: '00', available: 1000n, locked: 0n }]])
    );
    mockReadOnlyWalletWrapper.getAddressAtIndex.mockResolvedValue({
      address: 'HFirstAddr',
      index: 0,
      transactions: 0,
    });
    mockGetAddressForMode.mockResolvedValue('HAddr123');
    mockOnConnectionReady.mockResolvedValue(undefined);

    // Mock window.ethereum for verifySnapInstallation
    Object.defineProperty(globalThis, 'window', {
      value: {
        ...globalThis.window,
        ethereum: {
          isMetaMask: true,
          request: vi.fn().mockResolvedValue(mockSnapResponse),
        },
      },
      writable: true,
    });
  });

  it('should proceed normally when snap network matches stored network', async () => {
    localStorage.setItem('hathor_wallet_xpub', 'xpub123');
    localStorage.setItem('hathor_wallet_network', 'mainnet');

    // Snap reports mainnet (matches stored)
    mockInvokeSnap.mockResolvedValue({
      response: { network: 'mainnet' },
    });

    await act(async () => {
      renderHook(() => useWalletConnection(defaultOptions));
    });

    await vi.waitFor(() => {
      expect(mockOnConnectionReady).toHaveBeenCalledWith('mainnet');
    });

    // Should NOT call htr_changeNetwork since networks match
    const changeNetworkCalls = mockInvokeSnap.mock.calls.filter(
      (call) => call[0].method === 'htr_changeNetwork'
    );
    expect(changeNetworkCalls).toHaveLength(0);

    // Wallet initialized with correct network
    expect(mockReadOnlyWalletWrapper.initialize).toHaveBeenCalledWith('xpub123', 'mainnet');
  });

  it('should sync snap to stored network when they differ', async () => {
    localStorage.setItem('hathor_wallet_xpub', 'xpub123');
    localStorage.setItem('hathor_wallet_network', 'testnet');

    // Snap reports mainnet (differs from stored testnet)
    mockInvokeSnap.mockResolvedValue({
      response: { network: 'mainnet' },
    });

    await act(async () => {
      renderHook(() => useWalletConnection(defaultOptions));
    });

    await vi.waitFor(() => {
      expect(mockOnConnectionReady).toHaveBeenCalledWith('testnet');
    });

    // Should call htr_changeNetwork to sync snap to stored testnet
    expect(mockInvokeSnap).toHaveBeenCalledWith({
      method: 'htr_changeNetwork',
      params: { network: 'mainnet', newNetwork: 'testnet' },
    });

    // Wallet initialized with stored network (testnet)
    expect(mockReadOnlyWalletWrapper.initialize).toHaveBeenCalledWith('xpub123', 'testnet');
  });

  it('should fall back to snap network when network change fails', async () => {
    localStorage.setItem('hathor_wallet_xpub', 'xpub123');
    localStorage.setItem('hathor_wallet_network', 'testnet');

    // First call: htr_getConnectedNetwork returns mainnet
    mockInvokeSnap.mockResolvedValueOnce({
      response: { network: 'mainnet' },
    });
    // Second call: htr_changeNetwork fails
    mockInvokeSnap.mockRejectedValueOnce(new Error('Failed to change network'));

    await act(async () => {
      renderHook(() => useWalletConnection(defaultOptions));
    });

    await vi.waitFor(() => {
      expect(mockOnConnectionReady).toHaveBeenCalledWith('mainnet');
    });

    // Wallet should be initialized with snap's actual network (mainnet) since change failed
    expect(mockReadOnlyWalletWrapper.initialize).toHaveBeenCalledWith('xpub123', 'mainnet');

    // localStorage should be updated to reflect actual network
    expect(localStorage.getItem('hathor_wallet_network')).toBe('mainnet');
  });

  it('should proceed with stored network when network check fails entirely', async () => {
    localStorage.setItem('hathor_wallet_xpub', 'xpub123');
    localStorage.setItem('hathor_wallet_network', 'testnet');

    // htr_getConnectedNetwork throws
    mockInvokeSnap.mockRejectedValueOnce(new Error('Snap not responding'));

    await act(async () => {
      renderHook(() => useWalletConnection(defaultOptions));
    });

    await vi.waitFor(() => {
      expect(mockOnConnectionReady).toHaveBeenCalledWith('testnet');
    });

    // Should still initialize with stored network as best effort
    expect(mockReadOnlyWalletWrapper.initialize).toHaveBeenCalledWith('xpub123', 'testnet');
  });

  it('should use DEFAULT_NETWORK when no stored network and snap differs', async () => {
    localStorage.setItem('hathor_wallet_xpub', 'xpub123');
    // No stored network - should default to 'mainnet'

    // Snap reports testnet
    mockInvokeSnap.mockResolvedValueOnce({
      response: { network: 'testnet' },
    });
    // Change network call succeeds
    mockInvokeSnap.mockResolvedValueOnce({ response: { success: true } });

    await act(async () => {
      renderHook(() => useWalletConnection(defaultOptions));
    });

    await vi.waitFor(() => {
      expect(mockOnConnectionReady).toHaveBeenCalledWith('mainnet');
    });

    // Should change snap from testnet to default mainnet
    expect(mockInvokeSnap).toHaveBeenCalledWith({
      method: 'htr_changeNetwork',
      params: { network: 'testnet', newNetwork: 'mainnet' },
    });
  });
});
