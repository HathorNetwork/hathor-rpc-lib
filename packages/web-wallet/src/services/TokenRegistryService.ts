import type { TokenInfo, TokenData, TokenMetadata, ValidationResult, DagMetadata } from '../types/token';
import { readOnlyWalletWrapper } from './ReadOnlyWalletWrapper';
import { tokenStorageService } from './TokenStorageService';
import { tokensUtils } from '@hathor/wallet-lib';
import { nftDetectionService } from './NftDetectionService';
import { createLogger } from '../utils/logger';

const log = createLogger('TokenRegistryService');

/**
 * Service for managing token registration, validation, and metadata.
 *
 * Configuration string format (from wallet-lib):
 * `[name:symbol:uid:checksum]`
 *
 * Example: `[MyToken:TKN:00001bc7043d0aa910e28aff4b2aad8b4de76c709da4d16a48bf713067245029:abc123]`
 *
 * This service maintains separation between:
 * - Token data (stable: uid, name, symbol, configString)
 * - Token metadata (changeable: isNFT, registeredAt, dagMetadata)
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
      // Token already registered - update metadata and return
      return await this.refreshTokenInfo(uid, network, genesisHash);
    }

    // Create token data (stable)
    const tokenData: TokenData = {
      uid,
      name,
      symbol,
      configString,
    };

    // Detect NFT status and metadata before creating metadata
    let isNFT = false;
    let dagMetadata: DagMetadata | null = null;
    try {
      const metadata = await nftDetectionService.detectNft(uid, network);
      isNFT = metadata?.nft ?? false;
      dagMetadata = metadata;
    } catch (error) {
      log.warn(`Failed to detect NFT status for ${uid}, defaulting to false:`, error);
    }

    // Create token metadata (changeable)
    const tokenMetadata: TokenMetadata = {
      uid,
      isNFT,
      registeredAt: Date.now(),
      metadata: dagMetadata || undefined,
    };

    // Save data and metadata separately
    const existingData = tokenStorageService.loadTokenData(network, genesisHash);
    const updatedData = [...existingData, tokenData];
    const dataSaved = tokenStorageService.saveTokenData(network, genesisHash, updatedData);

    if (!dataSaved) {
      throw new Error('Failed to save token data to browser storage. Storage may be full or disabled.');
    }

    const metadataSaved = tokenStorageService.updateTokenMetadata(network, genesisHash, uid, tokenMetadata);
    if (!metadataSaved) {
      log.warn(`Failed to save token metadata for ${uid}. Metadata may be lost on refresh.`);
    }

    // Cache metadata
    this.tokenCache.set(uid, tokenMetadata);

    // Try to fetch balance
    let balance = { available: 0n, locked: 0n };
    try {
      const balances = await readOnlyWalletWrapper.getBalance(uid);
      const tokenBalance = balances.get(uid);
      if (tokenBalance) {
        balance = {
          available: tokenBalance.available || 0n,
          locked: tokenBalance.locked || 0n,
        };
      }
    } catch (error) {
      log.warn(`Could not fetch balance for token ${uid}:`, error);
    }

    // Return combined TokenInfo
    return {
      ...tokenData,
      ...tokenMetadata,
      balance,
    };
  }

  /**
   * Refresh token info (fetch latest metadata and balance)
   * This method only updates metadata, not core data
   */
  private async refreshTokenInfo(
    uid: string,
    network: string,
    genesisHash: string
  ): Promise<TokenInfo> {
    const tokenData = tokenStorageService.loadTokenData(network, genesisHash).find(t => t.uid === uid);
    if (!tokenData) {
      throw new Error(`Token ${uid} not found in storage`);
    }

    let metadata = tokenStorageService.getTokenMetadata(network, genesisHash, uid);
    let needsMetadataUpdate = false;

    // Update NFT status and metadata
    try {
      const dagMetadata = await nftDetectionService.detectNft(uid, network);
      const isNft = dagMetadata?.nft ?? false;

      if (!metadata || metadata.isNFT !== isNft || (!metadata.metadata && dagMetadata)) {
        metadata = {
          uid,
          isNFT: isNft,
          registeredAt: metadata?.registeredAt || Date.now(),
          metadata: dagMetadata || undefined,
        };
        needsMetadataUpdate = true;
      }
    } catch (error) {
      log.warn(`Failed to update NFT status for ${uid}:`, error);
      // Use existing metadata or create default
      if (!metadata) {
        metadata = {
          uid,
          isNFT: false,
          registeredAt: Date.now(),
        };
        needsMetadataUpdate = true;
      }
    }

    // Save metadata if it changed (data remains unchanged)
    if (needsMetadataUpdate) {
      const saved = tokenStorageService.updateTokenMetadata(network, genesisHash, uid, metadata);
      if (saved) {
        this.tokenCache.set(uid, metadata);
      }
    }

    // Fetch balance
    let balance = { available: 0n, locked: 0n };
    try {
      const balances = await readOnlyWalletWrapper.getBalance(uid);
      const tokenBalance = balances.get(uid);
      if (tokenBalance) {
        balance = {
          available: tokenBalance.available || 0n,
          locked: tokenBalance.locked || 0n,
        };
      }
    } catch (error) {
      log.error(`Failed to update balance for ${uid}:`, error);
    }

    return {
      ...tokenData,
      ...metadata,
      balance,
    };
  }

  /**
   * Unregister a token (removes both data and metadata)
   */
  unregisterToken(tokenUid: string, network: string, genesisHash: string): void {
    const dataSaved = tokenStorageService.removeTokenData(network, genesisHash, tokenUid);

    if (!dataSaved) {
      throw new Error('Failed to save token unregistration. The token may reappear on page refresh.');
    }

    tokenStorageService.removeTokenMetadata(network, genesisHash, tokenUid);

    // Remove from cache
    this.tokenCache.delete(tokenUid);
  }

  /**
   * Update metadata for a specific token without affecting data or other tokens
   * This is the key method that enables updating metadata independently
   */
  updateTokenMetadata(
    tokenUid: string,
    network: string,
    genesisHash: string,
    metadata: Partial<Omit<TokenMetadata, 'uid'>>
  ): boolean {
    const existing = tokenStorageService.getTokenMetadata(network, genesisHash, tokenUid);
    if (!existing) {
      log.warn(`Cannot update metadata for unregistered token ${tokenUid}`);
      return false;
    }

    const updated: TokenMetadata = {
      ...existing,
      ...metadata,
      uid: tokenUid, // Ensure uid doesn't change
    };

    const saved = tokenStorageService.updateTokenMetadata(network, genesisHash, tokenUid, updated);
    if (saved) {
      this.tokenCache.set(tokenUid, updated);
    }
    return saved;
  }

  /**
   * Validate configuration string format and checksum using wallet-lib
   */
  validateConfigString(configString: string): ValidationResult {
    try {
      const tokenData = tokensUtils.getTokenFromConfigurationString(configString);

      if (!tokenData) {
        return {
          valid: false,
          error: 'Invalid configuration string',
        };
      }

      return {
        valid: true,
        parsed: {
          uid: tokenData.uid,
          name: tokenData.name,
          symbol: tokenData.symbol,
        },
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  /**
   * Get all registered tokens for network
   * Combines data and metadata to create TokenInfo objects
   */
  getRegisteredTokens(network: string, genesisHash: string): TokenInfo[] {
    const tokenData = tokenStorageService.loadTokenData(network, genesisHash);
    const allMetadata = tokenStorageService.loadTokenMetadata(network, genesisHash);

    return tokenData.map(data => {
      const metadata = allMetadata[data.uid] || {
        uid: data.uid,
        isNFT: false,
        registeredAt: Date.now(),
      };

      return {
        ...data,
        ...metadata,
        balance: {
          available: 0n,
          locked: 0n,
        },
      };
    });
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
