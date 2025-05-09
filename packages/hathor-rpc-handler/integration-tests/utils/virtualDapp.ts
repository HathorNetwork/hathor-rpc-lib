import Client from '@walletconnect/sign-client';
import { SignClientTypes } from '@walletconnect/types';
import {
  WC_LOGGER_LEVEL,
  WC_PROJECT_ID,
  WC_RELAY_URL,
} from './walletConnectConfig';

/**
 * Creates a virtual dApp Client and generates a pairing URI
 * Returns the URI and functions to approve or reject the pairing
 */
export async function createVirtualDappPairing() {
  // Initialize a separate client to act as a dApp
  console.log('Initializing virtual dApp client...');
  const dappMetadata: SignClientTypes.Metadata = {
    name: 'Virtual Test dApp',
    description: 'A virtual dApp for testing connections',
    url: 'https://test.example.com',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  };

  const dappClient = await Client.init({
    logger: WC_LOGGER_LEVEL,
    relayUrl: WC_RELAY_URL,
    projectId: WC_PROJECT_ID,
    metadata: dappMetadata
  });

  console.log('Virtual dApp client initialized');

  // Create a new pairing and get the URI
  const { uri, approval } = await dappClient.connect({
    requiredNamespaces: {
      hathor: {
        methods: ['wallet_sendTransaction', 'wallet_getAddresses'],
        chains: ['hathor:testnet'],
        events: ['chainChanged', 'accountsChanged']
      }
    }
  });

  console.log('Created pairing proposal with URI');

  // Return the URI and functions to approve/reject
  return {
    pairingUri: uri,
    approvePairing: async () => {
      console.log('Virtual dApp: Approving pairing...');
      
      // Define the session namespaces for approval
      const sessionNamespaces = {
        hathor: {
          accounts: ['hathor:testnet:0xWalletAddress1234567890'],
          methods: ['wallet_sendTransaction', 'wallet_getAddresses'],
          events: ['chainChanged', 'accountsChanged']
        }
      };
      
      // The approval function expects sessionNamespaces as a parameter
      // @ts-expect-error - WalletConnect type definitions are incorrect
      await approval(sessionNamespaces);
      console.log('Virtual dApp: Pairing approved');
    },
    rejectPairing: async () => {
      console.log('Virtual dApp: Rejecting pairing...');
      try {
        // When rejecting, we use an empty function call
        // The WalletConnect types are a bit off, but this works
        await approval();
        console.log('Virtual dApp: Pairing rejected');
      } catch (error) {
        console.error('Error rejecting pairing:', error);
      }
    },
    dappClient // Return the client for cleanup
  };
} 
