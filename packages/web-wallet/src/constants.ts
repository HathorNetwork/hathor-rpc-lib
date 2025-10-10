// Network configuration
export const NETWORKS = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet'
} as const;

// WafpWYepbV13FVM9Qp9brmBTXgjrn3dnfx 
// Hathor API endpoints
export const HATHOR_API_URLS = {
  MAINNET: 'https://node.hathor.network/v1a',
  TESTNET: 'https://node1.hotel.testnet.hathor.network/v1a'
} as const;

// Hathor explorer URLs
export const HATHOR_EXPLORER_URLS = {
  MAINNET: 'https://explorer.hathor.network',
  TESTNET: 'https://explorer.testnet.hathor.network'
} as const;

// Token IDs
export const TOKEN_IDS = {
  HTR: '00'
} as const;

// Default configuration
export const DEFAULT_NETWORK = NETWORKS.MAINNET;
export const DEFAULT_ADDRESS_INDEX = 0;
export const DEFAULT_ADDRESS_TYPE = 'index' as const;

// UI Constants
export const QR_CODE_SIZE = 200;
export const TRANSACTION_HISTORY_LIMIT = 50;

// Snap configuration (these should match the snap's configuration)
export const SNAP_CONFIG = {
  DEFAULT_PORT: 8080,
  LOCAL_ORIGIN: `local:http://localhost:8080`
} as const;
