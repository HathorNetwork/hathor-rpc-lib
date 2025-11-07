import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TokenStorageService } from '../TokenStorageService';
import type { TokenInfo } from '../../types/token';

describe('TokenStorageService', () => {
  let service: TokenStorageService;
  const network = 'testnet';
  const genesisHash = '';

  const mockToken: TokenInfo = {
    uid: '00001bc7043d0aa910e28aff4b2aad8b4de76c709da4d16a48bf713067245029',
    name: 'Test Token',
    symbol: 'TST',
    balance: { available: 1000n, locked: 0n },
    isNFT: false,
    configString: '[Test Token:TST:00001bc7043d0aa910e28aff4b2aad8b4de76c709da4d16a48bf713067245029:abc123]',
    registeredAt: Date.now(),
  };

  beforeEach(() => {
    service = new TokenStorageService();
    localStorage.clear();
  });

  describe('saveTokens', () => {
    it('should save tokens to localStorage successfully', () => {
      const result = service.saveTokens(network, genesisHash, [mockToken]);

      expect(result).toBe(true);
      const stored = localStorage.getItem('hathor_wallet_registered_tokens_testnet_');
      expect(stored).toBeTruthy();
    });

    it('should return false when localStorage quota is exceeded', () => {
      // Spy on localStorage.setItem to throw QuotaExceededError
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const result = service.saveTokens(network, genesisHash, [mockToken]);

      expect(result).toBe(false);

      // Restore
      setItemSpy.mockRestore();
    });

    it('should return false when localStorage is disabled', () => {
      // Spy on localStorage.setItem to throw
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage is disabled');
      });

      const result = service.saveTokens(network, genesisHash, [mockToken]);

      expect(result).toBe(false);

      // Restore
      setItemSpy.mockRestore();
    });

    it('should save with correct version number', () => {
      service.saveTokens(network, genesisHash, [mockToken]);

      const stored = localStorage.getItem('hathor_wallet_registered_tokens_testnet_');
      const data = JSON.parse(stored!);

      expect(data.version).toBe(1);
    });
  });

  describe('loadTokens', () => {
    it('should return empty array when no tokens stored', () => {
      const tokens = service.loadTokens(network, genesisHash);

      expect(tokens).toEqual([]);
    });

    it('should load tokens successfully', () => {
      service.saveTokens(network, genesisHash, [mockToken]);
      const tokens = service.loadTokens(network, genesisHash);

      expect(tokens).toHaveLength(1);
      expect(tokens[0].uid).toBe(mockToken.uid);
      expect(tokens[0].name).toBe(mockToken.name);
      expect(tokens[0].symbol).toBe(mockToken.symbol);
    });

    it('should return empty array and clear storage when JSON is corrupted', () => {
      // Store corrupted JSON
      localStorage.setItem('hathor_wallet_registered_tokens_testnet_', 'invalid{json}');

      const tokens = service.loadTokens(network, genesisHash);

      expect(tokens).toEqual([]);
      // Should have cleared the corrupted data
      expect(localStorage.getItem('hathor_wallet_registered_tokens_testnet_')).toBeNull();
    });

    it('should migrate old format (array) to new format (with version)', () => {
      // Store old format (direct array)
      const oldFormat = [{
        uid: mockToken.uid,
        name: mockToken.name,
        symbol: mockToken.symbol,
        configString: mockToken.configString,
        registeredAt: mockToken.registeredAt,
        isNFT: false,
      }];
      localStorage.setItem('hathor_wallet_registered_tokens_testnet_', JSON.stringify(oldFormat));

      const tokens = service.loadTokens(network, genesisHash);

      expect(tokens).toHaveLength(1);
      expect(tokens[0].uid).toBe(mockToken.uid);
    });

    it('should handle localStorage.getItem throwing error', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      const tokens = service.loadTokens(network, genesisHash);

      expect(tokens).toEqual([]);

      // Restore
      getItemSpy.mockRestore();
    });
  });

  describe('clearTokens', () => {
    it('should clear tokens for specific network', () => {
      service.saveTokens(network, genesisHash, [mockToken]);
      service.clearTokens(network, genesisHash);

      const tokens = service.loadTokens(network, genesisHash);
      expect(tokens).toEqual([]);
    });

    it('should not throw when clearing non-existent tokens', () => {
      expect(() => {
        service.clearTokens(network, genesisHash);
      }).not.toThrow();
    });
  });

  describe('isTokenRegistered', () => {
    it('should return true when token is registered', () => {
      service.saveTokens(network, genesisHash, [mockToken]);

      const isRegistered = service.isTokenRegistered(network, genesisHash, mockToken.uid);

      expect(isRegistered).toBe(true);
    });

    it('should return false when token is not registered', () => {
      const isRegistered = service.isTokenRegistered(network, genesisHash, mockToken.uid);

      expect(isRegistered).toBe(false);
    });

    it('should return false when different network', () => {
      service.saveTokens(network, genesisHash, [mockToken]);

      const isRegistered = service.isTokenRegistered('mainnet', genesisHash, mockToken.uid);

      expect(isRegistered).toBe(false);
    });
  });

  describe('network-specific storage', () => {
    it('should isolate tokens by network', () => {
      const testnetToken = { ...mockToken, symbol: 'TST_TEST' };
      const mainnetToken = { ...mockToken, symbol: 'TST_MAIN' };

      service.saveTokens('testnet', genesisHash, [testnetToken]);
      service.saveTokens('mainnet', genesisHash, [mainnetToken]);

      const testnetTokens = service.loadTokens('testnet', genesisHash);
      const mainnetTokens = service.loadTokens('mainnet', genesisHash);

      expect(testnetTokens).toHaveLength(1);
      expect(testnetTokens[0].symbol).toBe('TST_TEST');

      expect(mainnetTokens).toHaveLength(1);
      expect(mainnetTokens[0].symbol).toBe('TST_MAIN');
    });
  });
});
