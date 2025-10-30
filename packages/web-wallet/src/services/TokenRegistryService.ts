import type { TokenInfo, TokenMetadata, ValidationResult } from '../types/token';
import { readOnlyWalletService } from './ReadOnlyWalletService';
import { tokenStorageService } from './TokenStorageService';
import helpers from '@hathor/wallet-lib/lib/utils/helpers';

/**
 * Service for managing token registration, validation, and metadata.
 *
 * Configuration string format (from wallet-lib):
 * `[name:symbol:uid:checksum]`
 *
 * Example: `[MyToken:TKN:00001bc7043d0aa910e28aff4b2aad8b4de76c709da4d16a48bf713067245029:abc123]`
 */
export class TokenRegistryService {
  private tokenCache: Map<string, TokenMetadata> = new Map();

  /**
   * Register a token from configuration string
   */
  async registerToken(
    configString: string,
    network: string,
    genesisHash: string
  ): Promise<TokenInfo> {
    // Validate format
    const validation = this.validateConfigString(configString);
    if (!validation.valid || !validation.parsed) {
      throw new Error(validation.error || 'Invalid configuration string');
    }

    const { uid, name, symbol } = validation.parsed;

    // Check if already registered (idempotent)
    if (tokenStorageService.isTokenRegistered(network, genesisHash, uid)) {
      // Token already registered - fetch fresh balance and return
      const existingTokens = tokenStorageService.loadTokens(network, genesisHash);
      const existing = existingTokens.find(t => t.uid === uid);
      if (existing) {
        // Update balance before returning
        try {
          const balances = await readOnlyWalletService.getBalance(uid);
          if (balances && balances.length > 0) {
            existing.balance = {
              available: balances[0].available || 0,
              locked: balances[0].locked || 0,
            };
          }
        } catch (error) {
          console.error(`Failed to update balance for existing token ${uid}:`, error);
          // Keep existing balance if fetch fails
        }
        return existing;
      }
    }

    // Try to fetch balance (but allow registration even if balance fetch fails)
    let balance = { available: 0, locked: 0 };
    try {
      const balances = await readOnlyWalletService.getBalance(uid);
      if (balances && balances.length > 0) {
        balance = {
          available: balances[0].available || 0,
          locked: balances[0].locked || 0,
        };
      }
    } catch (error) {
      console.warn(`Could not fetch balance for token ${uid}, registering with 0 balance:`, error);
      // Continue with zero balance
    }

    // Create token info
    const tokenInfo: TokenInfo = {
      uid,
      name,
      symbol,
      balance,
      isNFT: false, // TODO: Detect NFT from token properties
      configString,
      registeredAt: Date.now(),
    };

    // Save to cache
    this.tokenCache.set(uid, {
      uid,
      name,
      symbol,
      isNFT: false,
    });

    // Save to storage
    const existingTokens = tokenStorageService.loadTokens(network, genesisHash);
    const updatedTokens = [...existingTokens, tokenInfo];
    tokenStorageService.saveTokens(network, genesisHash, updatedTokens);

    return tokenInfo;
  }

  /**
   * Unregister a token
   */
  unregisterToken(tokenUid: string, network: string, genesisHash: string): void {
    const tokens = tokenStorageService.loadTokens(network, genesisHash);
    const filtered = tokens.filter(t => t.uid !== tokenUid);
    tokenStorageService.saveTokens(network, genesisHash, filtered);

    // Remove from cache
    this.tokenCache.delete(tokenUid);
  }

  /**
   * Validate configuration string format and checksum
   */
  validateConfigString(configString: string): ValidationResult {
    try {
      // Remove brackets if present
      let cleaned = configString.trim();
      if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
        cleaned = cleaned.slice(1, -1);
      }

      // Split into parts: name:symbol:uid:checksum
      const parts = cleaned.split(':');
      if (parts.length !== 4) {
        return {
          valid: false,
          error: 'Invalid format. Expected: [name:symbol:uid:checksum]',
        };
      }

      const [name, symbol, uid, providedChecksum] = parts;

      // Validate each part
      if (!name || name.length === 0) {
        return { valid: false, error: 'Token name cannot be empty' };
      }

      if (!symbol || symbol.length === 0) {
        return { valid: false, error: 'Token symbol cannot be empty' };
      }

      if (!uid || !/^[0-9a-f]{64}$/i.test(uid)) {
        return {
          valid: false,
          error: 'Token UID must be 64 hexadecimal characters',
        };
      }

      // Verify checksum
      const partialConfig = `${name}:${symbol}:${uid}`;
      const buffer = Buffer.from(partialConfig);
      const calculatedChecksum = helpers.getChecksum(buffer).toString('hex');

      if (calculatedChecksum !== providedChecksum.toLowerCase()) {
        return {
          valid: false,
          error: 'Invalid checksum. The configuration string may be corrupted.',
        };
      }

      return {
        valid: true,
        parsed: { uid, name, symbol },
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  /**
   * Fetch token metadata from wallet-lib
   */
  async fetchTokenMetadata(tokenUid: string): Promise<TokenMetadata> {
    // Check cache first
    const cached = this.tokenCache.get(tokenUid);
    if (cached) {
      return cached;
    }

    // Fetch from wallet-lib
    try {
      const tokens = await readOnlyWalletService.getTokens();
      const tokenData = tokens.find((t: any) => t.uid === tokenUid);

      if (!tokenData) {
        throw new Error('Token not found');
      }

      const metadata: TokenMetadata = {
        uid: tokenData.uid,
        name: tokenData.name || 'Unknown',
        symbol: tokenData.symbol || '???',
        isNFT: false, // TODO: Detect from token properties
      };

      // Cache it
      this.tokenCache.set(tokenUid, metadata);

      return metadata;
    } catch (error) {
      throw new Error(`Failed to fetch token metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all registered tokens for network
   */
  getRegisteredTokens(network: string, genesisHash: string): TokenInfo[] {
    return tokenStorageService.loadTokens(network, genesisHash);
  }

  /**
   * Check if token is registered
   */
  isTokenRegistered(network: string, genesisHash: string, tokenUid: string): boolean {
    return tokenStorageService.isTokenRegistered(network, genesisHash, tokenUid);
  }

  /**
   * Clear all cached metadata
   */
  clearCache(): void {
    this.tokenCache.clear();
  }
}

// Export singleton instance
export const tokenRegistryService = new TokenRegistryService();
