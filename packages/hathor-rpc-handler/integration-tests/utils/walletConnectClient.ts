import Client from '@walletconnect/sign-client';
import {
  WC_APP_METADATA,
  WC_LOGGER_LEVEL,
  WC_PROJECT_ID,
  WC_RELAY_URL,
} from './walletConnectConfig';

let clientInstance: Client | null = null;

/**
 * Initializes and returns a singleton WalletConnect Client instance.
 */
export async function initializeWalletConnectClient(): Promise<Client> {
  if (clientInstance) {
    console.log('WalletConnect Client already initialized.');
    return clientInstance;
  }

  console.log(`Initializing WalletConnect Client with relay: ${WC_RELAY_URL}`);
  console.log(`Using Project ID: ${WC_PROJECT_ID}`);
  try {
    console.log('Calling Client.init...', {
      logger: WC_LOGGER_LEVEL,
      relayUrl: WC_RELAY_URL,
      projectId: WC_PROJECT_ID,
      metadata: WC_APP_METADATA,
    });
    clientInstance = await Client.init({
      logger: WC_LOGGER_LEVEL,
      relayUrl: WC_RELAY_URL,
      projectId: WC_PROJECT_ID,
      metadata: WC_APP_METADATA,
    });
    console.log('Client.init call completed.');

    clientInstance.core.relayer.once('relayer_connect', () => {
      console.log('RELAYER CONNECT');
    });
    console.log('WalletConnect Client initialized successfully.');
    return clientInstance;
  } catch (error) {
    console.error('Failed to initialize WalletConnect client:', error);
    throw error; // Re-throw error to fail tests if connection fails
  }
}

/**
 * Gets the initialized WalletConnect Client instance.
 * Throws an error if the client hasn't been initialized.
 */
export function getWalletConnectClient(): Client {
  if (!clientInstance) {
    throw new Error('WalletConnect client is not initialized. Call initializeWalletConnectClient first.');
  }
  return clientInstance;
}

/**
 * Disconnects the WalletConnect client if it's initialized.
 */
export async function disconnectWalletConnectClient(): Promise<void> {
  if (clientInstance) {
    try {
      console.log('Disconnecting WalletConnect Client...');
      // Just nullify the client and let garbage collection handle cleanup
      clientInstance = null;
      console.log('WalletConnect Client disconnected.');
    } catch (error) {
      console.error('Error during WalletConnect client disconnection:', error);
      // Ensure client is nullified
      clientInstance = null;
    }
  } else {
    console.log('WalletConnect Client was not initialized, no need to disconnect.');
  }
} 
