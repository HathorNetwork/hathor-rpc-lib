/**
 * Integration test for the token registration + balance refresh race condition.
 *
 * This test verifies that when:
 * 1. A token is registered
 * 2. A WebSocket event fires immediately (before React state propagates)
 * 3. refreshBalance() is called
 *
 * The balance refresh should include the newly registered token because
 * it reads from registeredTokensRef.current (always up-to-date) instead
 * of the registeredTokens state array (which may be stale in callbacks).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTokenState } from '../useTokenState';
import { useWalletBalance } from '../useWalletBalance';

// Hoisted mocks
const {
  mockTokenRegistryService,
  mockReadOnlyWalletWrapper,
  mockLoadTokensWithBalances,
  mockFetchTokenBalance,
  mockGetAddressForMode,
} = vi.hoisted(() => ({
  mockTokenRegistryService: {
    registerToken: vi.fn(),
    unregisterToken: vi.fn(),
    getRegisteredTokens: vi.fn(() => []),
  },
  mockReadOnlyWalletWrapper: {
    isReady: vi.fn(() => true),
    getBalance: vi.fn(),
  },
  mockLoadTokensWithBalances: vi.fn(),
  mockFetchTokenBalance: vi.fn(),
  mockGetAddressForMode: vi.fn(),
}));

vi.mock('../../../services/TokenRegistryService', () => ({
  tokenRegistryService: mockTokenRegistryService,
}));

vi.mock('../../../services/ReadOnlyWalletWrapper', () => ({
  readOnlyWalletWrapper: mockReadOnlyWalletWrapper,
}));

vi.mock('../../../utils/tokenLoading', () => ({
  loadTokensWithBalances: mockLoadTokensWithBalances,
  fetchTokenBalance: mockFetchTokenBalance,
}));

vi.mock('../../../utils/addressMode', () => ({
  getAddressForMode: mockGetAddressForMode,
}));

vi.mock('../../../utils/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('Token Balance Race Condition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadOnlyWalletWrapper.isReady.mockReturnValue(true);
    mockGetAddressForMode.mockResolvedValue('HTestAddress');
  });

  describe('registeredTokensRef ensures race-free balance refresh', () => {
    it('should include newly registered token in balance refresh even if called immediately', async () => {
      // Mock getBalance to return balance for any requested token
      mockReadOnlyWalletWrapper.getBalance.mockImplementation(async (tokenId: string) => {
        if (tokenId === '00') {
          return new Map([['00', { token: '00', available: 1000n, locked: 0n }]]);
        }
        if (tokenId === '00newtoken') {
          return new Map([['00newtoken', { token: '00newtoken', available: 500n, locked: 0n }]]);
        }
        return new Map();
      });

      const mockNewToken = {
        uid: '00newtoken',
        name: 'New Token',
        symbol: 'NEW',
        isNFT: false,
        balance: { available: 0n, locked: 0n },
      };

      mockTokenRegistryService.registerToken.mockResolvedValue(mockNewToken);
      mockFetchTokenBalance.mockResolvedValue({ available: 500n, locked: 0n });

      // Initialize useTokenState
      const { result: tokenStateResult } = renderHook(() =>
        useTokenState({
          isConnected: true,
          network: 'mainnet',
        })
      );

      // Initialize useWalletBalance with the ref from tokenState
      const { result: balanceResult } = renderHook(() =>
        useWalletBalance({
          isConnected: true,
          addressMode: 'first',
          registeredTokensRef: tokenStateResult.current.registeredTokensRef,
          onError: vi.fn(),
        })
      );

      // Simulate the race condition scenario:
      // 1. Register a token
      // 2. IMMEDIATELY call refreshBalance (simulating WebSocket event)
      //    - In the old code, this would use stale registeredTokens
      //    - In the new code, this uses registeredTokensRef.current (always fresh)

      await act(async () => {
        // Step 1: Register the token
        await tokenStateResult.current.registerToken('00newtoken:New Token:NEW');

        // Step 2: Immediately call refreshBalance (simulates WebSocket new-tx event)
        // This is the critical moment - does refreshBalance see the new token?
        await balanceResult.current.refreshBalance();
      });

      // Verify getBalance was called for BOTH HTR and the new token
      expect(mockReadOnlyWalletWrapper.getBalance).toHaveBeenCalledWith('00');
      expect(mockReadOnlyWalletWrapper.getBalance).toHaveBeenCalledWith('00newtoken');

      // Verify the balances map contains both tokens
      expect(balanceResult.current.balances.has('00')).toBe(true);
      expect(balanceResult.current.balances.has('00newtoken')).toBe(true);
      expect(balanceResult.current.balances.get('00newtoken')?.available).toBe(500n);
    });

    it('should handle rapid register + refresh cycles correctly', async () => {
      mockReadOnlyWalletWrapper.getBalance.mockImplementation(async (tokenId: string) => {
        return new Map([[tokenId, { token: tokenId, available: 100n, locked: 0n }]]);
      });

      const createMockToken = (id: string) => ({
        uid: id,
        name: `Token ${id}`,
        symbol: id.toUpperCase(),
        isNFT: false,
        balance: { available: 0n, locked: 0n },
      });

      mockTokenRegistryService.registerToken.mockImplementation(async (configString: string) => {
        const uid = configString.split(':')[0];
        return createMockToken(uid);
      });
      mockFetchTokenBalance.mockResolvedValue({ available: 100n, locked: 0n });

      const { result: tokenStateResult } = renderHook(() =>
        useTokenState({ isConnected: true, network: 'mainnet' })
      );

      const { result: balanceResult } = renderHook(() =>
        useWalletBalance({
          isConnected: true,
          addressMode: 'first',
          registeredTokensRef: tokenStateResult.current.registeredTokensRef,
          onError: vi.fn(),
        })
      );

      // Clear mock to track calls per refresh cycle
      mockReadOnlyWalletWrapper.getBalance.mockClear();

      // First: register token A, then refresh
      await act(async () => {
        await tokenStateResult.current.registerToken('tokenA:Token A:TKA');
        await balanceResult.current.refreshBalance();
      });

      // After first refresh: should have called getBalance for HTR + tokenA
      expect(mockReadOnlyWalletWrapper.getBalance).toHaveBeenCalledWith('00');
      expect(mockReadOnlyWalletWrapper.getBalance).toHaveBeenCalledWith('tokenA');
      expect(mockReadOnlyWalletWrapper.getBalance).not.toHaveBeenCalledWith('tokenB');

      mockReadOnlyWalletWrapper.getBalance.mockClear();

      // Second: register token B, then refresh
      await act(async () => {
        await tokenStateResult.current.registerToken('tokenB:Token B:TKB');
        await balanceResult.current.refreshBalance();
      });

      // After second refresh: should have called getBalance for HTR + tokenA + tokenB
      expect(mockReadOnlyWalletWrapper.getBalance).toHaveBeenCalledWith('00');
      expect(mockReadOnlyWalletWrapper.getBalance).toHaveBeenCalledWith('tokenA');
      expect(mockReadOnlyWalletWrapper.getBalance).toHaveBeenCalledWith('tokenB');
    });

    it('should handle unregister + refresh correctly', async () => {
      mockReadOnlyWalletWrapper.getBalance.mockImplementation(async (tokenId: string) => {
        return new Map([[tokenId, { token: tokenId, available: 100n, locked: 0n }]]);
      });

      const mockToken = {
        uid: '00toremove',
        name: 'Token To Remove',
        symbol: 'REM',
        isNFT: false,
        balance: { available: 0n, locked: 0n },
      };

      mockTokenRegistryService.registerToken.mockResolvedValue(mockToken);
      mockFetchTokenBalance.mockResolvedValue({ available: 100n, locked: 0n });

      const { result: tokenStateResult } = renderHook(() =>
        useTokenState({ isConnected: true, network: 'mainnet' })
      );

      const { result: balanceResult } = renderHook(() =>
        useWalletBalance({
          isConnected: true,
          addressMode: 'first',
          registeredTokensRef: tokenStateResult.current.registeredTokensRef,
          onError: vi.fn(),
        })
      );

      // Register token first
      await act(async () => {
        await tokenStateResult.current.registerToken('00toremove:Token To Remove:REM');
      });

      // Clear mock to track unregister cycle
      mockReadOnlyWalletWrapper.getBalance.mockClear();

      // Unregister and immediately refresh
      await act(async () => {
        await tokenStateResult.current.unregisterToken('00toremove');
        await balanceResult.current.refreshBalance();
      });

      // Should have called getBalance for HTR only
      expect(mockReadOnlyWalletWrapper.getBalance).toHaveBeenCalledWith('00');
      // Should NOT have called getBalance for the unregistered token
      expect(mockReadOnlyWalletWrapper.getBalance).not.toHaveBeenCalledWith('00toremove');
    });
  });

  describe('ref vs state timing', () => {
    it('registeredTokensRef.current should be updated before next tick', async () => {
      const mockToken = {
        uid: '00test',
        name: 'Test',
        symbol: 'TST',
        isNFT: false,
        balance: { available: 0n, locked: 0n },
      };

      mockTokenRegistryService.registerToken.mockResolvedValue(mockToken);
      mockFetchTokenBalance.mockResolvedValue({ available: 100n, locked: 0n });

      const { result } = renderHook(() =>
        useTokenState({ isConnected: true, network: 'mainnet' })
      );

      // Before registration
      expect(result.current.registeredTokensRef.current).toHaveLength(0);

      await act(async () => {
        await result.current.registerToken('00test:Test:TST');
      });

      // After registration - ref should be updated
      expect(result.current.registeredTokensRef.current).toHaveLength(1);
      expect(result.current.registeredTokensRef.current[0].uid).toBe('00test');

      // State should also be updated (they should be in sync)
      expect(result.current.registeredTokens).toHaveLength(1);
      expect(result.current.registeredTokens[0].uid).toBe('00test');
    });
  });
});
