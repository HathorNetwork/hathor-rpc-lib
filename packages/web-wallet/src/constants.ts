// Import wallet-lib constants
import { constants as walletLibConstants } from '@hathor/wallet-lib';

// Network configuration
export const NETWORKS = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet'
} as const;

// WafpWYepbV13FVM9Qp9brmBTXgjrn3dnfx 
// Hathor API endpoints
export const HATHOR_API_URLS = {
  MAINNET: 'https://node1.mainnet.hathor.network/v1a',
  TESTNET: 'https://node1.testnet.hathor.network/v1a'
} as const;

// Hathor explorer URLs
export const HATHOR_EXPLORER_URLS = {
  MAINNET: 'https://explorer.hathor.network',
  TESTNET: 'https://explorer.testnet.hathor.network'
} as const;

// Wallet service URLs
export const WALLET_SERVICE_URLS = {
  MAINNET: 'https://wallet-service.hathor.network/',
  TESTNET: 'https://wallet-service.testnet.hathor.network/'
} as const;

// Wallet service WebSocket URLs
export const WALLET_SERVICE_WS_URLS = {
  MAINNET: 'wss://ws.wallet-service.hathor.network/',
  TESTNET: 'wss://ws.wallet-service.testnet.hathor.network/'
} as const;

// Token IDs - Re-export from wallet-lib for convenience
export const TOKEN_IDS = {
  HTR: walletLibConstants.NATIVE_TOKEN_UID
} as const;

// HTR Token Information
export const HTR_TOKEN_INFO = {
  uid: TOKEN_IDS.HTR,
  name: 'Hathor',
  symbol: 'HTR',
  isNFT: false,
} as const;

// Decimal places for HTR (used for conversion between HTR and cents)
export const HTR_DECIMAL_PLACES = walletLibConstants.DECIMAL_PLACES;
export const HTR_DECIMAL_MULTIPLIER = 10 ** HTR_DECIMAL_PLACES; // 100
export const HTR_DECIMAL_MULTIPLIER_BIGINT = BigInt(10 ** HTR_DECIMAL_PLACES); // 100n

// Default configuration
export const DEFAULT_NETWORK = NETWORKS.MAINNET;
export const DEFAULT_ADDRESS_INDEX = 0;
export const DEFAULT_ADDRESS_TYPE = 'index' as const;

// UI Constants
export const QR_CODE_SIZE = 200;
export const TRANSACTION_HISTORY_LIMIT = 50;
export const CHECK_CONNECTION_TIMEOUT = 10000;

// Snap Version Requirements
export const MIN_SNAP_VERSION = import.meta.env.VITE_MIN_SNAP_VERSION || '0.0.0';
