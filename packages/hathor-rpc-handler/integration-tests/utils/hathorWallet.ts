import { HathorWallet } from '@hathor/wallet-lib';
import { HATHOR_TEST_SEED } from './config';

let walletInstance: HathorWallet | null = null;

/**
 * Initializes and returns a singleton HathorWallet instance for testing.
 * 
 * Note: This basic initialization might need adjustments depending on 
 * specific test requirements (e.g., network, server).
 */
export function initializeHathorWallet(): HathorWallet {
  if (walletInstance) {
    return walletInstance;
  }

  // Basic configuration, adjust as necessary
  const walletConfig = {
    seed: HATHOR_TEST_SEED,
    network: 'testnet', // Assuming testnet for integration tests
    connection: undefined, // Use default connection or configure if needed
    password: '123', // Default password for testing
    pinCode: '123', // Default pin for testing
  };

  walletInstance = new HathorWallet(walletConfig);
  
  // Start the wallet (important step)
  // Note: Starting might involve network requests, ensure environment allows this.
  // Consider if starting should happen here or per-test suite.
  // For now, let's assume starting here is fine.
  // await walletInstance.start(); // Uncomment and handle async if needed
  
  console.log('Hathor Wallet initialized for testing.');
  return walletInstance;
}

/**
 * Gets the initialized HathorWallet instance.
 * Throws an error if the wallet hasn't been initialized.
 */
export function getHathorWallet(): HathorWallet {
  if (!walletInstance) {
    throw new Error('Hathor Wallet is not initialized. Call initializeHathorWallet first.');
  }
  return walletInstance;
}

// Optional: Add a function to stop/clean up the wallet if necessary
export async function stopHathorWallet(): Promise<void> {
  if (walletInstance) {
    // await walletInstance.stop(); // Uncomment if wallet needs explicit stopping
    walletInstance = null;
    console.log('Hathor Wallet stopped.');
  }
} 
