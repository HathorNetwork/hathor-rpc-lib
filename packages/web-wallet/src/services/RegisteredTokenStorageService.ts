import type { TokenData, TokenMetadata, TokenDataStorage, TokenMetadataStorage } from "../types/token";
import { createLogger } from '../utils/logger';

const log = createLogger('RegisteredTokenStorageService');

/**
 * Service for persisting token data and metadata to localStorage with network-specific keys.
 *
 * Storage format:
 * - Data Key: `hathor_wallet_token_data_{network}_{genesisHash}`
 * - Metadata Key: `hathor_wallet_token_metadata_{network}_{genesisHash}`
 *
 * Separating data from metadata allows updating metadata (like NFT detection)
 * without triggering updates to the stable token data list, avoiding unnecessary re-renders.
 *
 * Note: genesisHash is currently empty string, will be populated when RPC handler is updated
 */
export class RegisteredTokenStorageService {
  private readonly DATA_STORAGE_PREFIX = "hathor_wallet_token_data";
  private readonly METADATA_STORAGE_PREFIX = "hathor_wallet_token_metadata";
  private readonly CURRENT_VERSION = 1;

  /**
   * Save token data (stable information)
   * @returns true if save was successful, false otherwise
   */
  saveTokenData(network: string, genesisHash: string, tokens: Record<string, TokenData>): boolean {
    try {
      const storageData: TokenDataStorage = {
        tokens,
        version: this.CURRENT_VERSION,
      };

      const key = this.getDataStorageKey(network, genesisHash);
      localStorage.setItem(key, JSON.stringify(storageData));
      return true;
    } catch (error) {
      log.error("Failed to save token data to localStorage:", error);
      return false;
    }
  }

  /**
   * Load token data for specific network and genesisHash
   * Handles migration from old array format to new record format
   */
  loadTokenData(network: string, genesisHash: string): Record<string, TokenData> {
    try {
      const key = this.getDataStorageKey(network, genesisHash);
      const stored = localStorage.getItem(key);

      if (!stored) {
        return {};
      }

      const data = JSON.parse(stored);

      // Handle migration from old array format
      if (Array.isArray(data.tokens)) {
        const migrated: Record<string, TokenData> = {};
        for (const token of data.tokens) {
          migrated[token.uid] = token;
        }
        // Save migrated data
        this.saveTokenData(network, genesisHash, migrated);
        return migrated;
      }

      return data.tokens || {};
    } catch (error) {
      log.error("Failed to load token data from localStorage:", error);
      return {};
    }
  }

  /**
   * Add a single token to storage
   * @returns true if save was successful, false otherwise
   */
  addTokenData(network: string, genesisHash: string, token: TokenData): boolean {
    try {
      const tokens = this.loadTokenData(network, genesisHash);
      tokens[token.uid] = token;
      return this.saveTokenData(network, genesisHash, tokens);
    } catch (error) {
      log.error(`Failed to add token ${token.uid} to localStorage:`, error);
      return false;
    }
  }

  /**
   * Get a single token's data from storage
   */
  getTokenData(network: string, genesisHash: string, tokenUid: string): TokenData | null {
    const tokens = this.loadTokenData(network, genesisHash);
    return tokens[tokenUid] || null;
  }

  /**
   * Save token metadata (changeable information)
   * @returns true if save was successful, false otherwise
   */
  saveTokenMetadata(network: string, genesisHash: string, metadata: Record<string, TokenMetadata>): boolean {
    try {
      const storageData: TokenMetadataStorage = {
        metadata,
        version: this.CURRENT_VERSION,
      };

      const key = this.getMetadataStorageKey(network, genesisHash);
      localStorage.setItem(key, JSON.stringify(storageData));
      return true;
    } catch (error) {
      log.error("Failed to save token metadata to localStorage:", error);
      return false;
    }
  }

  /**
   * Load token metadata for specific network and genesisHash
   */
  loadTokenMetadata(network: string, genesisHash: string): Record<string, TokenMetadata> {
    try {
      const key = this.getMetadataStorageKey(network, genesisHash);
      const stored = localStorage.getItem(key);

      if (!stored) {
        return {};
      }

      const data = JSON.parse(stored) as TokenMetadataStorage;
      return data.metadata || {};
    } catch (error) {
      log.error("Failed to load token metadata from localStorage:", error);
      return {};
    }
  }

  /**
   * Update metadata for a specific token without affecting other tokens
   * This is the key method that enables updating metadata independently
   */
  updateTokenMetadata(network: string, genesisHash: string, tokenUid: string, metadata: TokenMetadata): boolean {
    try {
      const allMetadata = this.loadTokenMetadata(network, genesisHash);
      allMetadata[tokenUid] = metadata;
      return this.saveTokenMetadata(network, genesisHash, allMetadata);
    } catch (error) {
      log.error("Failed to update token metadata:", error);
      return false;
    }
  }

  /**
   * Get metadata for a specific token
   */
  getTokenMetadata(network: string, genesisHash: string, tokenUid: string): TokenMetadata | null {
    const allMetadata = this.loadTokenMetadata(network, genesisHash);
    return allMetadata[tokenUid] || null;
  }

  /**
   * Remove a single token's data from storage (O(1) lookup)
   * @returns true if removal was successful, false otherwise
   */
  removeTokenData(network: string, genesisHash: string, tokenUid: string): boolean {
    try {
      const tokens = this.loadTokenData(network, genesisHash);
      delete tokens[tokenUid];
      return this.saveTokenData(network, genesisHash, tokens);
    } catch (error) {
      log.error(`Failed to remove token ${tokenUid} from localStorage:`, error);
      return false;
    }
  }

  /**
   * Remove a single token's metadata from storage
   * @returns true if removal was successful, false otherwise
   */
  removeTokenMetadata(network: string, genesisHash: string, tokenUid: string): boolean {
    try {
      const allMetadata = this.loadTokenMetadata(network, genesisHash);
      delete allMetadata[tokenUid];
      return this.saveTokenMetadata(network, genesisHash, allMetadata);
    } catch (error) {
      log.error(`Failed to remove token ${tokenUid} metadata from localStorage:`, error);
      return false;
    }
  }

  /**
   * Clear all token data for specific network and genesisHash
   */
  clearTokenData(network: string, genesisHash: string): void {
    try {
      const key = this.getDataStorageKey(network, genesisHash);
      localStorage.removeItem(key);
    } catch (error) {
      log.error("Failed to clear token data from localStorage:", error);
    }
  }

  /**
   * Clear all token metadata for specific network and genesisHash
   */
  clearTokenMetadata(network: string, genesisHash: string): void {
    try {
      const key = this.getMetadataStorageKey(network, genesisHash);
      localStorage.removeItem(key);
    } catch (error) {
      log.error("Failed to clear token metadata from localStorage:", error);
    }
  }

  /**
   * Clear both token data and metadata
   */
  clearAll(network: string, genesisHash: string): void {
    this.clearTokenData(network, genesisHash);
    this.clearTokenMetadata(network, genesisHash);
  }

  /**
   * Check if a token is already registered (O(1) lookup)
   */
  isTokenRegistered(network: string, genesisHash: string, tokenUid: string): boolean {
    const tokens = this.loadTokenData(network, genesisHash);
    return tokenUid in tokens;
  }

  /**
   * Get storage key for token data
   */
  private getDataStorageKey(network: string, genesisHash: string): string {
    return `${this.DATA_STORAGE_PREFIX}_${network}_${genesisHash}`;
  }

  /**
   * Get storage key for token metadata
   */
  private getMetadataStorageKey(network: string, genesisHash: string): string {
    return `${this.METADATA_STORAGE_PREFIX}_${network}_${genesisHash}`;
  }
}

// Export singleton instance
export const registeredTokenStorageService = new RegisteredTokenStorageService();
