import type { TokenInfo, TokenStorageData } from "../types/token";

/**
 * Service for persisting token registrations to localStorage with network-specific keys.
 *
 * Storage format:
 * Key: `hathor_wallet_registered_tokens_{network}_{genesisHash}`
 * Value: JSON serialized TokenStorageData
 *
 * Note: genesisHash is currently empty string, will be populated when RPC handler is updated
 */
export class TokenStorageService {
  private readonly STORAGE_PREFIX = "hathor_wallet_registered_tokens";
  private readonly CURRENT_VERSION = 1;

  /**
   * Save tokens for specific network and genesisHash
   */
  saveTokens(network: string, genesisHash: string, tokens: TokenInfo[]): void {
    try {
      const storageData: TokenStorageData = {
        tokens: tokens.map((token) => ({
          uid: token.uid,
          name: token.name,
          symbol: token.symbol,
          configString: token.configString || "",
          registeredAt: token.registeredAt,
          isNFT: token.isNFT,
        })),
        version: this.CURRENT_VERSION,
      };

      const key = this.getStorageKey(network, genesisHash);
      localStorage.setItem(key, JSON.stringify(storageData));
    } catch (error) {
      console.error("Failed to save tokens to localStorage:", error);
      // Don't throw - localStorage failures shouldn't crash the app
    }
  }

  /**
   * Load tokens for specific network and genesisHash
   */
  loadTokens(network: string, genesisHash: string): TokenInfo[] {
    try {
      const key = this.getStorageKey(network, genesisHash);
      const stored = localStorage.getItem(key);

      if (!stored) {
        return [];
      }

      const data = JSON.parse(stored);
      const migrated = this.migrateIfNeeded(data);

      // Convert storage format to TokenInfo format
      return migrated.tokens.map((token) => ({
        uid: token.uid,
        name: token.name,
        symbol: token.symbol,
        balance: {
          available: 0, // Will be fetched separately
          locked: 0,
        },
        isNFT: token.isNFT || false,
        configString: token.configString,
        registeredAt: token.registeredAt,
      }));
    } catch (error) {
      console.error("Failed to load tokens from localStorage:", error);
      return [];
    }
  }

  /**
   * Clear all tokens for specific network and genesisHash
   */
  clearTokens(network: string, genesisHash: string): void {
    try {
      const key = this.getStorageKey(network, genesisHash);
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Failed to clear tokens from localStorage:", error);
    }
  }

  /**
   * Check if a token is already registered
   */
  isTokenRegistered(
    network: string,
    genesisHash: string,
    tokenUid: string,
  ): boolean {
    const tokens = this.loadTokens(network, genesisHash);
    return tokens.some((token) => token.uid === tokenUid);
  }

  /**
   * Get storage key for network and genesisHash
   */
  private getStorageKey(network: string, genesisHash: string): string {
    // Format: hathor_wallet_registered_tokens_{network}_{genesisHash}
    // genesisHash is empty string for now until RPC handler is updated
    return `${this.STORAGE_PREFIX}_${network}_${genesisHash}`;
  }

  /**
   * Migrate storage format if needed for backward compatibility
   */
  private migrateIfNeeded(data: unknown): TokenStorageData {
    // If data doesn't have version field, it's an old format or invalid
    if (!data || typeof data !== "object") {
      return { tokens: [], version: this.CURRENT_VERSION };
    }

    const obj = data as Record<string, unknown>;

    // Check if it's already in current format
    if (obj.version === this.CURRENT_VERSION && Array.isArray(obj.tokens)) {
      return data as TokenStorageData;
    }

    // If it's an array directly (old format), migrate it
    if (Array.isArray(data)) {
      return {
        tokens: data as TokenStorageData["tokens"],
        version: this.CURRENT_VERSION,
      };
    }

    // If version is missing, add it
    if (!obj.version && Array.isArray(obj.tokens)) {
      return {
        tokens: obj.tokens as TokenStorageData["tokens"],
        version: this.CURRENT_VERSION,
      };
    }

    // Invalid format, return empty
    return { tokens: [], version: this.CURRENT_VERSION };
  }
}

// Export singleton instance
export const tokenStorageService = new TokenStorageService();
