import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockGetAllTokenBalances, mockGetTokens, mockIsReady, mockLoadTokenData } = vi.hoisted(() => ({
  mockGetAllTokenBalances: vi.fn(),
  mockGetTokens: vi.fn(),
  mockIsReady: vi.fn(),
  mockLoadTokenData: vi.fn(),
}));

vi.mock('../ReadOnlyWalletWrapper', () => ({
  readOnlyWalletWrapper: {
    getAllTokenBalances: mockGetAllTokenBalances,
    getTokens: mockGetTokens,
    isReady: mockIsReady,
  },
}));

vi.mock('../RegisteredTokenStorageService', () => ({
  registeredTokenStorageService: {
    loadTokenData: mockLoadTokenData,
  },
}));

vi.mock('../../constants', () => ({
  TOKEN_IDS: { HTR: '00' },
}));

vi.mock('../../utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { TokenDiscoveryService } from '../TokenDiscoveryService';

describe('TokenDiscoveryService', () => {
  let service: TokenDiscoveryService;

  const network = 'mainnet';

  // Simulates tokens stored in localStorage (keyed by uid)
  const storedTokens: Record<string, { uid: string; name: string; symbol: string }> = {
    'token-a-uid': { uid: 'token-a-uid', name: 'TokenA', symbol: 'TKA' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TokenDiscoveryService();
    mockIsReady.mockReturnValue(true);
    mockLoadTokenData.mockReturnValue(storedTokens);
  });

  describe('discoverTokenUids', () => {
    it('should return unregistered token UIDs', async () => {
      mockGetTokens.mockResolvedValue(['00', 'token-a-uid', 'token-b-uid', 'token-c-uid']);

      const uids = await service.discoverTokenUids(network);

      expect(uids).toEqual(['token-b-uid', 'token-c-uid']);
      expect(mockGetTokens).toHaveBeenCalledOnce();
      expect(mockLoadTokenData).toHaveBeenCalledWith(network, '');
    });

    it('should exclude HTR even if not in stored tokens', async () => {
      mockLoadTokenData.mockReturnValue({});
      mockGetTokens.mockResolvedValue(['00']);

      const uids = await service.discoverTokenUids(network);

      expect(uids).toHaveLength(0);
    });

    it('should return empty array when wallet is not ready', async () => {
      mockIsReady.mockReturnValue(false);

      const uids = await service.discoverTokenUids(network);

      expect(uids).toHaveLength(0);
      expect(mockGetTokens).not.toHaveBeenCalled();
    });

    it('should throw when getTokens fails', async () => {
      mockGetTokens.mockRejectedValue(new Error('Network error'));

      await expect(service.discoverTokenUids(network)).rejects.toThrow('Network error');
    });

    it('should return empty array when all tokens are already registered', async () => {
      mockGetTokens.mockResolvedValue(['00', 'token-a-uid']);

      const uids = await service.discoverTokenUids(network);

      expect(uids).toHaveLength(0);
    });
  });

  describe('fetchTokenDetails', () => {
    it('should return token details with balance', async () => {
      mockGetAllTokenBalances.mockResolvedValue([
        { uid: 'token-b-uid', name: 'TokenB', symbol: 'TKB', balance: { available: 200n, locked: 0n } },
      ]);

      const detail = await service.fetchTokenDetails('token-b-uid');

      expect(detail).toEqual({
        uid: 'token-b-uid',
        name: 'TokenB',
        symbol: 'TKB',
        balance: { available: 200n, locked: 0n },
      });
      expect(mockGetAllTokenBalances).toHaveBeenCalledWith('token-b-uid');
    });

    it('should return null when token not found in response', async () => {
      mockGetAllTokenBalances.mockResolvedValue([]);

      const detail = await service.fetchTokenDetails('nonexistent');

      expect(detail).toBeNull();
    });

    it('should return null on error', async () => {
      mockGetAllTokenBalances.mockRejectedValue(new Error('Fetch failed'));

      const detail = await service.fetchTokenDetails('token-b-uid');

      expect(detail).toBeNull();
    });
  });
});
