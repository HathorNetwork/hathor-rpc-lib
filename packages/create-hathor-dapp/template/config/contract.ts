export const DICE_CONTRACT_CONFIG = {
  // Contract ID (update after deploying your contract)
  contractId: process.env.NEXT_PUBLIC_DICE_CONTRACT_ID || '0x1111111111111111111111111111111111111111111111111111111111111111',

  // Blueprint ID
  blueprintId: process.env.NEXT_PUBLIC_DICE_BLUEPRINT_ID || 'hathor-dice',

  // Contract parameters (from the test case)
  houseEdgeBasisPoints: 190, // 1.90%
  maxBetAmount: 100_000_00,   // 1000 HTR (in cents)
  randomBitLength: 16,        // 65536 possible outcomes (0-65535)
  maxRoll: 10_000,            // Mapped to 0-9999 for percentage calculations

  // Network
  network: process.env.NEXT_PUBLIC_DEFAULT_NETWORK || 'testnet',

  // HTR Token UID
  tokenUid: '00',
};

export const NETWORKS = {
  mainnet: {
    name: 'Hathor Mainnet',
    explorerUrl: 'https://explorer.hathor.network',
    walletServiceUrl: 'https://wallet-service.hathor.network',
  },
  testnet: {
    name: 'Hathor Testnet',
    explorerUrl: 'https://explorer.testnet.hathor.network',
    walletServiceUrl: 'https://wallet-service.testnet.hathor.network',
  },
} as const;

export type NetworkName = keyof typeof NETWORKS;
