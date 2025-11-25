/**
 * Core token type definitions for the wallet
 */

export interface NFTMedia {
  file: string;
  type: string;
  loop: boolean;
  autoplay: boolean;
  mime_type?: string;
}

export interface DagMetadata {
  id: string;
  nft: boolean;
  banned: boolean;
  verified: boolean;
  reason?: string;
  nft_media?: NFTMedia;
}

/**
 * Core token data - stable, rarely changes
 * Contains only essential token identification and configuration
 */
export interface TokenData {
  uid: string;           // Token unique ID (64-char hex)
  name: string;          // Token name (e.g., "Hathor", "My Token")
  symbol: string;        // Token symbol (e.g., "HTR", "TKN")
  configString?: string; // Original registration config string
}

/**
 * Token metadata - can change more frequently
 * Contains auxiliary information that may be updated independently
 */
export interface TokenMetadata {
  uid: string;           // Reference to token
  isNFT: boolean;        // True if this is an NFT
  registeredAt?: number; // Timestamp when token was registered
  metadata?: DagMetadata; // DAG metadata (for NFTs, includes verified/banned status)
}

/**
 * Complete token information - combines data, metadata, and balance
 * This is a convenience interface for components that need all token info
 */
export interface TokenInfo extends TokenData {
  balance?: {            // Optional - may be loaded later
    available: bigint;   // Available balance in token base units
    locked: bigint;      // Locked balance in token base units
  };
  isNFT: boolean;        // True if this is an NFT
  metadata?: DagMetadata; // DAG metadata (for NFTs)
  registeredAt?: number;  // Timestamp when token was registered (optional for newly created tokens)
}

export type TokenFilter = 'all' | 'tokens' | 'nfts';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  parsed?: {
    uid: string;
    name: string;
    symbol: string;
  };
}

/**
 * Storage format for token data - stable, rarely changes
 */
export interface TokenDataStorage {
  tokens: TokenData[];
  version: number; // For future migrations
}

/**
 * Storage format for token metadata - can change frequently
 */
export interface TokenMetadataStorage {
  metadata: Record<string, TokenMetadata>; // Keyed by token uid for O(1) lookup
  version: number; // For future migrations
}

/**
 * @deprecated Use TokenDataStorage and TokenMetadataStorage instead
 * Kept for backward compatibility during migration
 */
export interface TokenStorageData {
  tokens: Array<TokenData & {
    registeredAt: number;
    isNFT: boolean;
    metadata?: DagMetadata;
  }>;
  version: number;
}
