import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadTokensWithBalances, fetchTokenBalance } from '../tokenLoading';
import type { TokenInfo } from '../../types/token';

// Mock the dependencies
vi.mock('../../services/ReadOnlyWalletWrapper', () => ({
  readOnlyWalletWrapper: {
    getBalance: vi.fn(),
  },
}));

vi.mock('../../services/TokenRegistryService', () => ({
  tokenRegistryService: {
    getRegisteredTokens: vi.fn(),
    updateTokenMetadata: vi.fn(),
  },
}));

vi.mock('../../services/RegisteredTokenStorageService', () => ({
  registeredTokenStorageService: {
    // No longer needed - using tokenRegistryService.updateTokenMetadata instead
  },
}));

vi.mock('../../services/NftDetectionService', () => ({
  nftDetectionService: {
    detectNftBatch: vi.fn(),
    clearCache: vi.fn(),
  },
}));

vi.mock('../logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { readOnlyWalletWrapper } from '../../services/ReadOnlyWalletWrapper';
import { tokenRegistryService } from '../../services/TokenRegistryService';
import { registeredTokenStorageService } from '../../services/RegisteredTokenStorageService';
import { nftDetectionService } from '../../services/NftDetectionService';

describe('tokenLoading utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadTokensWithBalances', () => {
    // Factory function to create fresh mock tokens for each test
    const createMockTokens = (): TokenInfo[] => [
      {
        uid: 'token1',
        symbol: 'TKN1',
        name: 'Token 1',
        isNFT: false,
      },
      {
        uid: 'token2',
        symbol: 'TKN2',
        name: 'Token 2',
        isNFT: false,
      },
    ];

    beforeEach(() => {
      vi.mocked(tokenRegistryService.getRegisteredTokens).mockReturnValue(createMockTokens());
      vi.mocked(nftDetectionService.detectNftBatch).mockResolvedValue(new Map());
      vi.mocked(readOnlyWalletWrapper.getBalance).mockResolvedValue(
        new Map([['token1', { token: 'token1', available: 100n, locked: 0n }]])
      );
    });

    it('should load tokens with balances successfully', async () => {
      const result = await loadTokensWithBalances('mainnet', '');

      expect(result.tokens).toHaveLength(2);
      expect(result.warning).toBeNull();
      expect(result.failedTokens).toHaveLength(0);
      expect(result.tokens[0].balance).toEqual({
        available: 100n,
        locked: 0n,
      });
    });

    it('should clear NFT cache when requested', async () => {
      await loadTokensWithBalances('mainnet', '', { clearNftCache: true });

      expect(nftDetectionService.clearCache).toHaveBeenCalledOnce();
    });

    it('should not clear NFT cache by default', async () => {
      await loadTokensWithBalances('mainnet', '');

      expect(nftDetectionService.clearCache).not.toHaveBeenCalled();
    });

    it('should update NFT metadata when detected', async () => {
      const nftMetadata = new Map([
        ['token1', { id: 'token1', nft: true, banned: false, verified: false }],
      ]);
      vi.mocked(nftDetectionService.detectNftBatch).mockResolvedValue(nftMetadata);

      const result = await loadTokensWithBalances('mainnet', '');

      expect(result.tokens[0].isNFT).toBe(true);
      expect(result.tokens[0].metadata).toEqual({ id: 'token1', nft: true, banned: false, verified: false });
      expect(tokenRegistryService.updateTokenMetadata).toHaveBeenCalled();
    });

    it('should track failed token balance fetches with detailed errors', async () => {
      vi.mocked(readOnlyWalletWrapper.getBalance)
        .mockResolvedValueOnce(new Map([['token1', { token: 'token1', available: 100n, locked: 0n }]]))
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await loadTokensWithBalances('mainnet', '', { detailedErrors: true });

      expect(result.tokens).toHaveLength(2);
      expect(result.failedTokens).toHaveLength(1);
      expect(result.failedTokens[0]).toEqual({
        uid: 'token2',
        symbol: 'TKN2',
        error: 'Network error',
      });
      expect(result.warning).toContain('TKN2');
      expect(result.warning).toContain('Showing cached values');
    });

    it('should track failed token balance fetches with simple count', async () => {
      vi.mocked(readOnlyWalletWrapper.getBalance)
        .mockResolvedValueOnce(new Map([['token1', { token: 'token1', available: 100n, locked: 0n }]]))
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await loadTokensWithBalances('mainnet', '', { detailedErrors: false });

      expect(result.failedTokens).toHaveLength(1);
      expect(result.warning).toContain('1 token');
      expect(result.warning).not.toContain('TKN2');
    });

    it('should handle multiple failed tokens with plural message', async () => {
      vi.mocked(readOnlyWalletWrapper.getBalance).mockRejectedValue(new Error('Network error'));

      const result = await loadTokensWithBalances('mainnet', '', { detailedErrors: false });

      expect(result.failedTokens).toHaveLength(2);
      expect(result.warning).toContain('2 tokens');
    });

    it('should handle tokens with no balance data', async () => {
      vi.mocked(readOnlyWalletWrapper.getBalance).mockResolvedValue(new Map());

      const result = await loadTokensWithBalances('mainnet', '');

      expect(result.tokens).toHaveLength(2);
      expect(result.tokens[0].balance).toBeUndefined();
      expect(result.warning).toBeNull();
    });

    it('should update metadata when NFT status changes', async () => {
      const nftMetadata = new Map([
        ['token1', { id: 'token1', nft: true, banned: false, verified: false }],
      ]);
      vi.mocked(nftDetectionService.detectNftBatch).mockResolvedValue(nftMetadata);

      await loadTokensWithBalances('mainnet', 'genesis123');

      expect(tokenRegistryService.updateTokenMetadata).toHaveBeenCalledWith(
        'token1',
        'mainnet',
        'genesis123',
        expect.objectContaining({ isNFT: true })
      );
    });

    it('should not update metadata if NFT status unchanged', async () => {
      vi.mocked(nftDetectionService.detectNftBatch).mockResolvedValue(new Map());

      await loadTokensWithBalances('mainnet', '');

      expect(tokenRegistryService.updateTokenMetadata).not.toHaveBeenCalled();
    });
  });

  describe('fetchTokenBalance', () => {
    it('should fetch balance successfully', async () => {
      vi.mocked(readOnlyWalletWrapper.getBalance).mockResolvedValue(
        new Map([['token123', { token: 'token123', available: 500n, locked: 100n }]])
      );

      const result = await fetchTokenBalance('token123');

      expect(result).toEqual({
        available: 500n,
        locked: 100n,
      });
    });

    it('should return null when balance fetch fails', async () => {
      vi.mocked(readOnlyWalletWrapper.getBalance).mockRejectedValue(
        new Error('Network error')
      );

      const result = await fetchTokenBalance('token123');

      expect(result).toBeNull();
    });

    it('should return null when no balance data available', async () => {
      vi.mocked(readOnlyWalletWrapper.getBalance).mockResolvedValue([]);

      const result = await fetchTokenBalance('token123');

      expect(result).toBeNull();
    });

    it('should handle null balance response', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(readOnlyWalletWrapper.getBalance).mockResolvedValue(null as any);

      const result = await fetchTokenBalance('token123');

      expect(result).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle unknown error types', async () => {
      vi.mocked(readOnlyWalletWrapper.getBalance).mockRejectedValue('String error');

      const result = await fetchTokenBalance('token123');

      expect(result).toBeNull();
    });

    it('should continue processing other tokens when one fails', async () => {
      vi.mocked(readOnlyWalletWrapper.getBalance)
        .mockResolvedValueOnce(new Map([['token1', { token: 'token1', available: 100n, locked: 0n }]]))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(new Map([['token3', { token: 'token3', available: 200n, locked: 0n }]]));

      const threeTokens: TokenInfo[] = [
        { uid: 'token1', symbol: 'TKN1', name: 'Token 1', isNFT: false },
        { uid: 'token2', symbol: 'TKN2', name: 'Token 2', isNFT: false },
        { uid: 'token3', symbol: 'TKN3', name: 'Token 3', isNFT: false },
      ];
      vi.mocked(tokenRegistryService.getRegisteredTokens).mockReturnValue(threeTokens);

      const result = await loadTokensWithBalances('mainnet', '');

      expect(result.tokens).toHaveLength(3);
      expect(result.failedTokens).toHaveLength(1);
      expect(result.tokens[0].balance).toEqual({ available: 100n, locked: 0n });
      expect(result.tokens[2].balance).toEqual({ available: 200n, locked: 0n });
    });
  });
});
