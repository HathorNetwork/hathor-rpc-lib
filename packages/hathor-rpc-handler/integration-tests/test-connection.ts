import Client from '@walletconnect/sign-client';
import {
  initializeWalletConnectClient,
  disconnectWalletConnectClient,
} from './utils/walletConnectClient';

let client: Client | null = null;

async function runConnectionTest() {
  console.log('Starting standalone connection test...');
  try {
    // Initialize client
    client = await initializeWalletConnectClient();
    console.log('Client initialized.');

    // Check initial connection state
    console.log(`Initial connection state: ${client.core.relayer.connected}`);

    // Set up event listener without waiting
    client.core.relayer.once('relayer_connect', () => {
      console.log('>>> relayer_connect event received! <<<');
      console.log(`Connection state after event: ${client!.core.relayer.connected}`);
    });

    client.core.relayer.once('relayer_error', (error: Error) => {
      console.error('>>> relayer_error event received! <<<', error);
    });

    // Wait a bit to see if we get the connect event
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log(`Final connection state: ${client.core.relayer.connected}`);
    console.log('Connection test completed.');

  } catch (error) {
    console.error('Connection test failed:', error);
    process.exitCode = 1; // Set exit code to indicate failure
  } finally {
    // Attempt to disconnect
    console.log('Attempting to disconnect...');
    await disconnectWalletConnectClient();
    console.log('Standalone test finished.');
  }
}

// Run the test
runConnectionTest(); 
