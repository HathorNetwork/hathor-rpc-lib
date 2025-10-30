/**
 * Core token type definitions for the wallet
 */

export interface TokenInfo {
  uid: string;           // Token unique ID (64-char hex)
  name: string;          // Token name (e.g., "Hathor", "My Token")
  symbol: string;        // Token symbol (e.g., "HTR", "TKN")
  balance: {
    available: number;   // Available balance in token base units
    locked: number;      // Locked balance in token base units
  };
  isNFT: boolean;        // True if this is an NFT
  configString?: string; // Original registration config string
  registeredAt: number;  // Timestamp when token was registered
}

export interface TokenMetadata {
  uid: string;
  name: string;
  symbol: string;
  isNFT: boolean;
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

export interface TokenStorageData {
  tokens: Array<{
    uid: string;
    name: string;
    symbol: string;
    configString: string;
    registeredAt: number;
    isNFT: boolean;
  }>;
  version: number; // For future migrations
}
