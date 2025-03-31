import {
  initializeWalletConnectClient,
  getWalletConnectClient,
  disconnectWalletConnectClient,
} from '../utils/walletConnectClient';

jest.setTimeout(120000); // Set longer timeout for the entire test suite

describe('WalletConnect Connection', () => {
  // Initialize client and wait for relay connection before tests
  beforeAll(async () => {
    try {
      const client = await initializeWalletConnectClient();
      console.log('Test Suite: WalletConnect client object initialized.');

      if (client.core.relayer.connected) {
        console.log('Test Suite: Relayer already connected.');
        return; // Already connected
      }

      console.log('Test Suite: Waiting for relayer connection...');
      await new Promise<void>((resolve, reject) => {
        // Timeout if connection takes too long
        const timeout = setTimeout(() => {
          console.error('Test Suite: Relayer connection attempt timed out.');
          reject(new Error('Relayer connection timeout'));
        }, 60000); // Increased timeout to 60 seconds

        // Use .once() as we only need the first connection event for setup
        client.core.relayer.once('relayer_connect', () => {
          clearTimeout(timeout);
          console.log("Test Suite: 'relayer_connect' event received.");
          resolve();
        });

        client.core.relayer.once('relayer_error', (error: Error) => {
          clearTimeout(timeout);
          console.error("Test Suite: 'relayer_error' event received.", error);
          reject(error);
        });
      });

    } catch (error) {
      console.error('Test Suite Error: Failed during WalletConnect client initialization or connection wait', error);
      // Optionally throw to fail the suite immediately
      throw error; 
    }
  });

  // Disconnect client after all tests in this suite have run
  afterAll(async () => {
    // No need for complex cleanup with done() since we're using --forceExit
    await disconnectWalletConnectClient();
    console.log('Test Suite: WalletConnect client disconnected.');
  });

  it('should initialize the WalletConnect client successfully', () => {
    // The beforeAll block handles initialization, so we just check if getClient works
    expect(() => getWalletConnectClient()).not.toThrow();
    const client = getWalletConnectClient();
    expect(client).toBeDefined();
    // Add more specific checks if needed, e.g., client properties
    expect(client.core.relayer.connected).toBe(true); // Check if relay connection is active
  });

  // Add more tests related to connection status or initial setup here
}); 
