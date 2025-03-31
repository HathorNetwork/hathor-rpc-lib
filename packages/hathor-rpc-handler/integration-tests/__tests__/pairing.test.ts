import {
  initializeWalletConnectClient,
  getWalletConnectClient,
  disconnectWalletConnectClient
} from '../utils/walletConnectClient';
import { createVirtualDappPairing } from '../utils/virtualDapp';

jest.setTimeout(120000); // Set longer timeout for the entire test suite

describe('WalletConnect Pairing', () => {
  // Initialize client before tests
  beforeAll(async () => {
    await initializeWalletConnectClient();
    console.log('Test Suite: WalletConnect client initialized for pairing tests');
  });

  // Disconnect client after tests
  afterAll(async () => {
    await disconnectWalletConnectClient();
    console.log('Test Suite: WalletConnect client disconnected after pairing tests');
  });

  it('should pair with a virtual dApp successfully', async () => {
    const client = getWalletConnectClient();
    expect(client).toBeDefined();
    
    // Create a virtual dApp and get the pairing URI
    const result = await createVirtualDappPairing();
    expect(result).toBeDefined();
    
    const { pairingUri, approvePairing, dappClient } = result;
    expect(pairingUri).toBeDefined();
    
    // Add non-null assertion to satisfy TypeScript
    expect(pairingUri!.startsWith('wc:')).toBe(true);
    
    console.log('Test Suite: Pairing URI created:', pairingUri);
    
    // Ensure pairingUri is defined before using it
    if (!pairingUri) {
      throw new Error('Pairing URI is undefined');
    }
    
    // Simulate wallet connecting to dApp by pairing with the URI
    const pairingPromise = client.pair({ uri: pairingUri });
    
    // Approve the pairing from the dApp side
    console.log('Test Suite: Approving pairing from dApp side');
    await approvePairing();
    
    // Wait for pairing to complete
    const pairingResult = await pairingPromise;
    expect(pairingResult).toBeDefined();
    expect(pairingResult.topic).toBeDefined();
    
    console.log('Test Suite: Pairing completed successfully with topic:', pairingResult.topic);
    
    // Verify that we have an active session
    const sessions = client.session.getAll();
    expect(sessions.length).toBeGreaterThan(0);
    
    // Verify the pairing exists
    const pairings = client.pairing.getAll();
    expect(pairings.some(p => p.topic === pairingResult.topic)).toBe(true);
    
    // Clean up the dApp client
    console.log('Test Suite: Cleaning up dApp client');
    await dappClient.core.relayer.transportClose();
  });
}); 