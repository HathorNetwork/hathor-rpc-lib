import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTokenState } from '../useTokenState';

// Hoisted mocks
const {
  mockTokenRegistryService,
  mockReadOnlyWalletWrapper,
  mockLoadTokensWithBalances,
  mockFetchTokenBalance,
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

vi.mock('../../../utils/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('useTokenState', () => {
  const defaultOptions = {
    isConnected: true,
    network: 'mainnet',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockReadOnlyWalletWrapper.isReady.mockReturnValue(true);
  });

  describe('initialization', () => {
    it('should initialize with empty tokens', () => {
      const { result } = renderHook(() => useTokenState(defaultOptions));

      expect(result.current.registeredTokens).toEqual([]);
      expect(result.current.registeredTokensRef.current).toEqual([]);
    });

    it('should initialize with default token filter', () => {
      const { result } = renderHook(() => useTokenState(defaultOptions));

      expect(result.current.selectedTokenFilter).toBe('tokens');
    });
  });

  describe('registerToken', () => {
    it('should register a new token and update state', async () => {
      const mockToken = {
        uid: '00abc123',
        name: 'Test Token',
        symbol: 'TST',
        isNFT: false,
        balance: { available: 0n, locked: 0n },
      };

      mockTokenRegistryService.registerToken.mockResolvedValue(mockToken);
      mockFetchTokenBalance.mockResolvedValue({ available: 100n, locked: 0n });

      const { result } = renderHook(() => useTokenState(defaultOptions));

      await act(async () => {
        await result.current.registerToken('00abc123:Test Token:TST');
      });

      expect(mockTokenRegistryService.registerToken).toHaveBeenCalledWith(
        '00abc123:Test Token:TST',
        'mainnet',
        ''
      );
      expect(result.current.registeredTokens).toHaveLength(1);
      expect(result.current.registeredTokens[0].uid).toBe('00abc123');
      expect(result.current.registeredTokens[0].balance).toEqual({ available: 100n, locked: 0n });
    });

    it('should update registeredTokensRef synchronously after registration', async () => {
      const mockToken = {
        uid: '00abc123',
        name: 'Test Token',
        symbol: 'TST',
        isNFT: false,
        balance: { available: 0n, locked: 0n },
      };

      mockTokenRegistryService.registerToken.mockResolvedValue(mockToken);
      mockFetchTokenBalance.mockResolvedValue({ available: 100n, locked: 0n });

      const { result } = renderHook(() => useTokenState(defaultOptions));

      await act(async () => {
        await result.current.registerToken('00abc123:Test Token:TST');
      });

      // The ref should be updated and match the state
      expect(result.current.registeredTokensRef.current).toHaveLength(1);
      expect(result.current.registeredTokensRef.current[0].uid).toBe('00abc123');
    });

    it('should throw error when not connected', async () => {
      const { result } = renderHook(() => useTokenState({
        ...defaultOptions,
        isConnected: false,
      }));

      await expect(
        act(async () => {
          await result.current.registerToken('00abc123:Test Token:TST');
        })
      ).rejects.toThrow('Wallet not connected');
    });

    it('should throw error when wallet not ready', async () => {
      mockReadOnlyWalletWrapper.isReady.mockReturnValue(false);

      const { result } = renderHook(() => useTokenState(defaultOptions));

      await expect(
        act(async () => {
          await result.current.registerToken('00abc123:Test Token:TST');
        })
      ).rejects.toThrow('Wallet not connected');
    });

    it('should update existing token if already registered', async () => {
      const mockToken1 = {
        uid: '00abc123',
        name: 'Test Token',
        symbol: 'TST',
        isNFT: false,
        balance: { available: 0n, locked: 0n },
      };

      const mockToken2 = {
        uid: '00abc123',
        name: 'Test Token Updated',
        symbol: 'TST',
        isNFT: false,
        balance: { available: 0n, locked: 0n },
      };

      mockTokenRegistryService.registerToken
        .mockResolvedValueOnce(mockToken1)
        .mockResolvedValueOnce(mockToken2);
      mockFetchTokenBalance.mockResolvedValue({ available: 100n, locked: 0n });

      const { result } = renderHook(() => useTokenState(defaultOptions));

      // Register first time
      await act(async () => {
        await result.current.registerToken('00abc123:Test Token:TST');
      });

      expect(result.current.registeredTokens).toHaveLength(1);

      // Register same token again (update)
      await act(async () => {
        await result.current.registerToken('00abc123:Test Token Updated:TST');
      });

      // Should still have only 1 token, but updated
      expect(result.current.registeredTokens).toHaveLength(1);
      expect(result.current.registeredTokens[0].name).toBe('Test Token Updated');
    });
  });

  describe('unregisterToken', () => {
    it('should remove token from state', async () => {
      const mockToken = {
        uid: '00abc123',
        name: 'Test Token',
        symbol: 'TST',
        isNFT: false,
        balance: { available: 0n, locked: 0n },
      };

      mockTokenRegistryService.registerToken.mockResolvedValue(mockToken);
      mockFetchTokenBalance.mockResolvedValue({ available: 100n, locked: 0n });

      const { result } = renderHook(() => useTokenState(defaultOptions));

      // First register a token
      await act(async () => {
        await result.current.registerToken('00abc123:Test Token:TST');
      });

      expect(result.current.registeredTokens).toHaveLength(1);

      // Then unregister it
      await act(async () => {
        await result.current.unregisterToken('00abc123');
      });

      expect(mockTokenRegistryService.unregisterToken).toHaveBeenCalledWith('00abc123', 'mainnet', '');
      expect(result.current.registeredTokens).toHaveLength(0);
      expect(result.current.registeredTokensRef.current).toHaveLength(0);
    });

    it('should throw error when trying to unregister HTR', async () => {
      const { result } = renderHook(() => useTokenState(defaultOptions));

      await expect(
        act(async () => {
          await result.current.unregisterToken('00');
        })
      ).rejects.toThrow('Cannot unregister the native HTR token');
    });

    it('should throw error when not connected', async () => {
      const { result } = renderHook(() => useTokenState({
        ...defaultOptions,
        isConnected: false,
      }));

      await expect(
        act(async () => {
          await result.current.unregisterToken('00abc123');
        })
      ).rejects.toThrow('Wallet is not connected');
    });
  });

  describe('loadTokensForNetwork', () => {
    it('should load tokens and update state', async () => {
      const mockTokens = [
        { uid: '00abc', name: 'Token A', symbol: 'TKA', isNFT: false, balance: { available: 100n, locked: 0n } },
        { uid: '00def', name: 'Token B', symbol: 'TKB', isNFT: true, balance: { available: 1n, locked: 0n } },
      ];

      mockLoadTokensWithBalances.mockResolvedValue({
        tokens: mockTokens,
        warning: null,
        failedTokens: [],
      });

      const { result } = renderHook(() => useTokenState(defaultOptions));

      await act(async () => {
        await result.current.loadTokensForNetwork('mainnet');
      });

      expect(mockLoadTokensWithBalances).toHaveBeenCalledWith('mainnet', '', expect.any(Object));
      expect(result.current.registeredTokens).toHaveLength(2);
      expect(result.current.registeredTokensRef.current).toHaveLength(2);
    });

    it('should return the load result with warning', async () => {
      mockLoadTokensWithBalances.mockResolvedValue({
        tokens: [],
        warning: 'Some tokens failed to load',
        failedTokens: [{ uid: '00xyz', symbol: 'XYZ', error: 'Network error' }],
      });

      const { result } = renderHook(() => useTokenState(defaultOptions));

      let loadResult;
      await act(async () => {
        loadResult = await result.current.loadTokensForNetwork('testnet');
      });

      expect(loadResult).toEqual({
        tokens: [],
        warning: 'Some tokens failed to load',
        failedTokens: [{ uid: '00xyz', symbol: 'XYZ', error: 'Network error' }],
      });
    });
  });

  describe('clearTokens', () => {
    it('should clear all tokens from state', async () => {
      const mockToken = {
        uid: '00abc123',
        name: 'Test Token',
        symbol: 'TST',
        isNFT: false,
        balance: { available: 0n, locked: 0n },
      };

      mockTokenRegistryService.registerToken.mockResolvedValue(mockToken);
      mockFetchTokenBalance.mockResolvedValue({ available: 100n, locked: 0n });

      const { result } = renderHook(() => useTokenState(defaultOptions));

      // Register a token
      await act(async () => {
        await result.current.registerToken('00abc123:Test Token:TST');
      });

      expect(result.current.registeredTokens).toHaveLength(1);

      // Clear tokens
      act(() => {
        result.current.clearTokens();
      });

      expect(result.current.registeredTokens).toHaveLength(0);
      expect(result.current.registeredTokensRef.current).toHaveLength(0);
    });
  });

  describe('getTokenInfo', () => {
    it('should return token info for registered token', async () => {
      const mockToken = {
        uid: '00abc123',
        name: 'Test Token',
        symbol: 'TST',
        isNFT: false,
        balance: { available: 0n, locked: 0n },
      };

      mockTokenRegistryService.registerToken.mockResolvedValue(mockToken);
      mockFetchTokenBalance.mockResolvedValue({ available: 100n, locked: 0n });

      const { result } = renderHook(() => useTokenState(defaultOptions));

      await act(async () => {
        await result.current.registerToken('00abc123:Test Token:TST');
      });

      const tokenInfo = result.current.getTokenInfo('00abc123');
      expect(tokenInfo).toBeDefined();
      expect(tokenInfo?.uid).toBe('00abc123');
    });

    it('should return undefined for unregistered token', () => {
      const { result } = renderHook(() => useTokenState(defaultOptions));

      const tokenInfo = result.current.getTokenInfo('nonexistent');
      expect(tokenInfo).toBeUndefined();
    });
  });

  describe('selectedTokenFilter', () => {
    it('should update token filter', () => {
      const { result } = renderHook(() => useTokenState(defaultOptions));

      expect(result.current.selectedTokenFilter).toBe('tokens');

      act(() => {
        result.current.setSelectedTokenFilter('nfts');
      });

      expect(result.current.selectedTokenFilter).toBe('nfts');
    });
  });

  describe('registeredTokensRef synchronization', () => {
    it('should keep ref in sync with state after multiple operations', async () => {
      const mockToken1 = { uid: '001', name: 'Token 1', symbol: 'TK1', isNFT: false, balance: { available: 0n, locked: 0n } };
      const mockToken2 = { uid: '002', name: 'Token 2', symbol: 'TK2', isNFT: false, balance: { available: 0n, locked: 0n } };

      mockTokenRegistryService.registerToken
        .mockResolvedValueOnce(mockToken1)
        .mockResolvedValueOnce(mockToken2);
      mockFetchTokenBalance.mockResolvedValue({ available: 50n, locked: 0n });

      const { result } = renderHook(() => useTokenState(defaultOptions));

      // Register first token
      await act(async () => {
        await result.current.registerToken('001:Token 1:TK1');
      });

      expect(result.current.registeredTokens).toHaveLength(1);
      expect(result.current.registeredTokensRef.current).toHaveLength(1);

      // Register second token
      await act(async () => {
        await result.current.registerToken('002:Token 2:TK2');
      });

      expect(result.current.registeredTokens).toHaveLength(2);
      expect(result.current.registeredTokensRef.current).toHaveLength(2);

      // Unregister first token
      await act(async () => {
        await result.current.unregisterToken('001');
      });

      expect(result.current.registeredTokens).toHaveLength(1);
      expect(result.current.registeredTokensRef.current).toHaveLength(1);
      expect(result.current.registeredTokensRef.current[0].uid).toBe('002');
    });
  });
});
