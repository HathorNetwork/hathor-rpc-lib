import { SignClientTypes } from '@walletconnect/types'; // Import Metadata type

// Use the Project ID observed in the working relay log
export const WC_PROJECT_ID = '8264fff563181da658ce64ee80e80458';

export const WC_RELAY_URL = 'ws://localhost:5555'; // Keep as localhost for now

export const WC_LOGGER_LEVEL = 'debug';

export const WC_APP_METADATA: SignClientTypes.Metadata = {
  name: 'Hathor RPC Integration Test',
  description: 'Integration tests for hathor-rpc-handler',
  url: '#', // Placeholder URL
  icons: [], // Placeholder Icons
}; 
