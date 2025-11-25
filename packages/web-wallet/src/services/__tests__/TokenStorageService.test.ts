import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TokenStorageService } from '../TokenStorageService';
import type { TokenData, TokenMetadata } from '../../types/token';

describe('TokenStorageService', () => {
  let service: TokenStorageService;
  const network = 'mainnet';
  const genesisHash = '';

  beforeEach(() => {
    service = new TokenStorageService();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token Data Storage', () => {
    describe('saveTokenData', () => {
      it('should save token data to localStorage successfully', () => {
        const tokens: TokenData[] = [
          { uid: 'token1', name: 'Token 1', symbol: 'TK1', configString: '[Token 1:TK1:token1:checksum]' },
          { uid: 'token2', name: 'Token 2', symbol: 'TK2', configString: '[Token 2:TK2:token2:checksum]' },
        ];

        const result = service.saveTokenData(network, genesisHash, tokens);

        expect(result).toBe(true);
        const stored = localStorage.getItem(`hathor_wallet_token_data_${network}_${genesisHash}`);
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed.version).toBe(1);
        expect(parsed.tokens).toHaveLength(2);
        expect(parsed.tokens[0].uid).toBe('token1');
      });

      it('should return false when localStorage quota is exceeded', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new Error('QuotaExceededError');
        });

        const result = service.saveTokenData(network, genesisHash, []);

        expect(result).toBe(false);
      });

      it('should return false when localStorage is disabled', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new Error('localStorage is disabled');
        });

        const result = service.saveTokenData(network, genesisHash, []);

        expect(result).toBe(false);
      });
    });

    describe('loadTokenData', () => {
      it('should return empty array when no tokens stored', () => {
        const tokens = service.loadTokenData(network, genesisHash);

        expect(tokens).toEqual([]);
      });

      it('should load token data successfully', () => {
        const tokens: TokenData[] = [
          { uid: 'token1', name: 'Token 1', symbol: 'TK1', configString: '[Token 1:TK1:token1:checksum]' },
        ];

        service.saveTokenData(network, genesisHash, tokens);
        const loaded = service.loadTokenData(network, genesisHash);

        expect(loaded).toHaveLength(1);
        expect(loaded[0].uid).toBe('token1');
        expect(loaded[0].name).toBe('Token 1');
      });

      it('should return empty array when JSON is corrupted', () => {
        localStorage.setItem(`hathor_wallet_token_data_${network}_${genesisHash}`, 'invalid{json}');

        const tokens = service.loadTokenData(network, genesisHash);

        expect(tokens).toEqual([]);
      });

      it('should handle localStorage.getItem throwing error', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new Error('localStorage access denied');
        });

        const tokens = service.loadTokenData(network, genesisHash);

        expect(tokens).toEqual([]);
      });
    });
  });

  describe('Token Metadata Storage', () => {
    describe('saveTokenMetadata', () => {
      it('should save token metadata to localStorage successfully', () => {
        const metadata: Record<string, TokenMetadata> = {
          'token1': { uid: 'token1', isNFT: false, registeredAt: Date.now() },
          'token2': { uid: 'token2', isNFT: true, registeredAt: Date.now() },
        };

        const result = service.saveTokenMetadata(network, genesisHash, metadata);

        expect(result).toBe(true);
        const stored = localStorage.getItem(`hathor_wallet_token_metadata_${network}_${genesisHash}`);
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed.version).toBe(1);
        expect(Object.keys(parsed.metadata)).toHaveLength(2);
      });
    });

    describe('loadTokenMetadata', () => {
      it('should return empty object when no metadata stored', () => {
        const metadata = service.loadTokenMetadata(network, genesisHash);

        expect(metadata).toEqual({});
      });

      it('should load token metadata successfully', () => {
        const metadata: Record<string, TokenMetadata> = {
          'token1': { uid: 'token1', isNFT: false, registeredAt: 12345 },
        };

        service.saveTokenMetadata(network, genesisHash, metadata);
        const loaded = service.loadTokenMetadata(network, genesisHash);

        expect(Object.keys(loaded)).toHaveLength(1);
        expect(loaded['token1'].isNFT).toBe(false);
        expect(loaded['token1'].registeredAt).toBe(12345);
      });
    });

    describe('updateTokenMetadata', () => {
      it('should update metadata for a specific token', () => {
        const metadata: Record<string, TokenMetadata> = {
          'token1': { uid: 'token1', isNFT: false, registeredAt: 12345 },
        };
        service.saveTokenMetadata(network, genesisHash, metadata);

        const updated: TokenMetadata = { uid: 'token1', isNFT: true, registeredAt: 12345 };
        const result = service.updateTokenMetadata(network, genesisHash, 'token1', updated);

        expect(result).toBe(true);
        const loaded = service.loadTokenMetadata(network, genesisHash);
        expect(loaded['token1'].isNFT).toBe(true);
      });
    });

    describe('getTokenMetadata', () => {
      it('should return metadata for specific token', () => {
        const metadata: Record<string, TokenMetadata> = {
          'token1': { uid: 'token1', isNFT: false, registeredAt: 12345 },
        };
        service.saveTokenMetadata(network, genesisHash, metadata);

        const result = service.getTokenMetadata(network, genesisHash, 'token1');

        expect(result).toEqual({ uid: 'token1', isNFT: false, registeredAt: 12345 });
      });

      it('should return null for non-existent token', () => {
        const result = service.getTokenMetadata(network, genesisHash, 'nonexistent');

        expect(result).toBeNull();
      });
    });
  });

  describe('Clear operations', () => {
    it('should clear token data for specific network', () => {
      const tokens: TokenData[] = [
        { uid: 'token1', name: 'Token 1', symbol: 'TK1' },
      ];
      service.saveTokenData(network, genesisHash, tokens);

      service.clearTokenData(network, genesisHash);

      const loaded = service.loadTokenData(network, genesisHash);
      expect(loaded).toEqual([]);
    });

    it('should clear token metadata for specific network', () => {
      const metadata: Record<string, TokenMetadata> = {
        'token1': { uid: 'token1', isNFT: false, registeredAt: 12345 },
      };
      service.saveTokenMetadata(network, genesisHash, metadata);

      service.clearTokenMetadata(network, genesisHash);

      const loaded = service.loadTokenMetadata(network, genesisHash);
      expect(loaded).toEqual({});
    });

    it('should clear both data and metadata', () => {
      const tokens: TokenData[] = [
        { uid: 'token1', name: 'Token 1', symbol: 'TK1' },
      ];
      const metadata: Record<string, TokenMetadata> = {
        'token1': { uid: 'token1', isNFT: false, registeredAt: 12345 },
      };
      service.saveTokenData(network, genesisHash, tokens);
      service.saveTokenMetadata(network, genesisHash, metadata);

      service.clearAll(network, genesisHash);

      expect(service.loadTokenData(network, genesisHash)).toEqual([]);
      expect(service.loadTokenMetadata(network, genesisHash)).toEqual({});
    });

    it('should not throw when clearing non-existent tokens', () => {
      expect(() => service.clearAll(network, genesisHash)).not.toThrow();
    });
  });

  describe('isTokenRegistered', () => {
    it('should return true when token is registered', () => {
      const tokens: TokenData[] = [
        { uid: 'token1', name: 'Token 1', symbol: 'TK1' },
      ];
      service.saveTokenData(network, genesisHash, tokens);

      const result = service.isTokenRegistered(network, genesisHash, 'token1');

      expect(result).toBe(true);
    });

    it('should return false when token is not registered', () => {
      const result = service.isTokenRegistered(network, genesisHash, 'nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when different network', () => {
      const tokens: TokenData[] = [
        { uid: 'token1', name: 'Token 1', symbol: 'TK1' },
      ];
      service.saveTokenData('mainnet', genesisHash, tokens);

      const result = service.isTokenRegistered('testnet', genesisHash, 'token1');

      expect(result).toBe(false);
    });
  });

  describe('Network isolation', () => {
    it('should isolate tokens by network', () => {
      const mainnetTokens: TokenData[] = [
        { uid: 'token1', name: 'Mainnet Token', symbol: 'MTK' },
      ];
      const testnetTokens: TokenData[] = [
        { uid: 'token2', name: 'Testnet Token', symbol: 'TTK' },
      ];

      service.saveTokenData('mainnet', genesisHash, mainnetTokens);
      service.saveTokenData('testnet', genesisHash, testnetTokens);

      const mainnetLoaded = service.loadTokenData('mainnet', genesisHash);
      const testnetLoaded = service.loadTokenData('testnet', genesisHash);

      expect(mainnetLoaded).toHaveLength(1);
      expect(mainnetLoaded[0].uid).toBe('token1');
      expect(testnetLoaded).toHaveLength(1);
      expect(testnetLoaded[0].uid).toBe('token2');
    });
  });
});
