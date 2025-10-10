import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { WalletServiceMethods } from '../services/HathorWalletService';
import { readOnlyWalletService } from '../services/ReadOnlyWalletService';
import { useInvokeSnap, useRequestSnap } from '@hathor/snap-utils';

// localStorage keys
const STORAGE_KEYS = {
  XPUB: 'hathor_wallet_xpub',
  NETWORK: 'hathor_wallet_network',
};

interface WalletBalance {
  token: string;
  available: number;
  locked: number;
}

interface TransactionHistoryItem {
  tx_id: string;
  timestamp: number;
  balance: number;
  is_voided: boolean;
}

interface SendTransactionParams {
  network: string;
  outputs: Array<{
    address?: string;
    value?: string;
    token?: string;
    type?: string;
    data?: string;
  }>;
  inputs?: Array<{ txId: string; index: number }>;
  changeAddress?: string;
}

interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  isCheckingConnection: boolean;
  loadingStep: string;
  address: string;
  balances: WalletBalance[];
  network: string;
  error: string | null;
  xpub: string | null;
}

interface WalletContextType extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
  refreshAddress: () => Promise<void>;
  getTransactionHistory: (count?: number, skip?: number, tokenId?: string) => Promise<TransactionHistoryItem[]>;
  sendTransaction: (params: SendTransactionParams) => Promise<any>;
  setError: (error: string | null) => void;
}

const initialState: WalletState = {
  isConnected: false,
  isConnecting: false,
  isCheckingConnection: true,
  loadingStep: 'Checking connection...',
  address: '',
  balances: [],
  network: 'mainnet',
  error: null,
  xpub: null,
};

const WalletContext = createContext<WalletContextType | null>(null);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [state, setState] = useState<WalletState>(initialState);
  const invokeSnap = useInvokeSnap();
  const requestSnap = useRequestSnap();
  const isCheckingRef = React.useRef(false);

  // Check for existing connection on mount
  const checkExistingConnection = async () => {
    // Prevent concurrent calls
    if (isCheckingRef.current) {
      console.log('Already checking connection, skipping...');
      return;
    }

    isCheckingRef.current = true;

    try {
      setState(prev => ({ ...prev, loadingStep: 'Checking existing connection...' }));

      // Check if we have a stored xpub in localStorage
      const storedXpub = localStorage.getItem(STORAGE_KEYS.XPUB);
      const storedNetwork = localStorage.getItem(STORAGE_KEYS.NETWORK) || 'dev-testnet';

      if (!storedXpub) {
        console.log('No stored xpub found, user needs to connect');
        setState(prev => ({
          ...prev,
          isCheckingConnection: false,
          loadingStep: '',
        }));
        return;
      }

      console.log('✅ Found stored xpub, reconnecting automatically...');
      setState(prev => ({ ...prev, loadingStep: 'Checking snap network...' }));

      // Check snap network and change if needed
      try {
        const networkTest = await invokeSnap({
          method: 'htr_getConnectedNetwork',
          params: {}
        });
        const parsedNetworkTest = typeof networkTest === 'string' ? JSON.parse(networkTest) : networkTest;
        const currentSnapNetwork = parsedNetworkTest?.response?.network;
        const targetNetwork = 'dev-testnet';

        if (currentSnapNetwork !== targetNetwork) {
          console.log(`🔄 Changing snap network from ${currentSnapNetwork} to ${targetNetwork}...`);
          setState(prev => ({ ...prev, loadingStep: 'Changing snap network to dev-testnet...' }));

          await invokeSnap({
            method: 'htr_changeNetwork',
            params: {
              network: currentSnapNetwork,
              newNetwork: targetNetwork
            }
          });
          console.log('✅ Snap network changed to dev-testnet');
        }
      } catch (networkError) {
        console.error('Failed to check/change network:', networkError);
      }

      setState(prev => ({ ...prev, loadingStep: 'Initializing read-only wallet...' }));

      // Stop any existing wallet before reinitializing
      if (readOnlyWalletService.isReady()) {
        console.log('Stopping existing wallet before reinitializing...');
        await readOnlyWalletService.stop();
      }

      // Initialize read-only wallet with stored xpub
      await readOnlyWalletService.initialize(storedXpub, storedNetwork);

      setState(prev => ({ ...prev, loadingStep: 'Loading wallet data...' }));

      // Get data from read-only wallet
      const addressInfo = readOnlyWalletService.getCurrentAddress();
      const address = addressInfo?.address || '';
      const balances = await readOnlyWalletService.getBalance('00');

      console.log('✅ Automatically reconnected with stored xpub');

      setState(prev => ({
        ...prev,
        isConnected: true,
        isCheckingConnection: false,
        address,
        balances,
        network: storedNetwork,
        xpub: storedXpub,
        loadingStep: '',
      }));
    } catch (error) {
      console.error('Failed to auto-reconnect:', error);

      // Only clear localStorage for specific errors (invalid xpub, authentication errors)
      // Don't clear for temporary network errors or wallet-service issues
      const errorMessage = error instanceof Error ? error.message : String(error);
      const shouldClearStorage =
        errorMessage.includes('Invalid xpub') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('unauthorized');

      if (shouldClearStorage) {
        console.warn('Clearing stored xpub due to authentication/validation error');
        localStorage.removeItem(STORAGE_KEYS.XPUB);
        localStorage.removeItem(STORAGE_KEYS.NETWORK);
      } else {
        console.log('Keeping stored xpub - error may be temporary');
      }

      setState(prev => ({
        ...prev,
        isCheckingConnection: false,
        loadingStep: '',
        error: 'Failed to reconnect. Please try connecting manually.',
      }));
    } finally {
      isCheckingRef.current = false;
    }
  };

  const connectWallet = async () => {
    setState(prev => ({ ...prev, isConnecting: true, loadingStep: 'Requesting snap...', error: null }));

    try {
      // Request the snap to install/activate it
      await requestSnap();
      setState(prev => ({ ...prev, loadingStep: 'Checking snap network...' }));

      // First, check if snap is working by getting network
      console.log('🔍 Testing snap connection...');
      let currentSnapNetwork;
      try {
        const networkTest = await invokeSnap({
          method: 'htr_getConnectedNetwork',
          params: {}
        });
        console.log('✅ Snap is responsive, network test:', networkTest);

        // Parse network response
        const parsedNetworkTest = typeof networkTest === 'string' ? JSON.parse(networkTest) : networkTest;
        currentSnapNetwork = parsedNetworkTest?.response?.network;
        console.log('📡 Snap current network:', currentSnapNetwork);
      } catch (testError) {
        console.error('❌ Snap is not responsive:', testError);
        throw new Error('Snap is not responding. Please make sure it is installed correctly.');
      }

      // Change snap network to dev-testnet if needed
      const targetNetwork = 'dev-testnet'; // Web wallet uses dev-testnet
      if (currentSnapNetwork !== targetNetwork) {
        console.log(`🔄 Changing snap network from ${currentSnapNetwork} to ${targetNetwork}...`);
        setState(prev => ({ ...prev, loadingStep: 'Changing snap network to dev-testnet...' }));

        try {
          await invokeSnap({
            method: 'htr_changeNetwork',
            params: {
              network: currentSnapNetwork,
              newNetwork: targetNetwork
            }
          });
          console.log('✅ Snap network changed to dev-testnet');
        } catch (networkError) {
          console.error('❌ Failed to change snap network:', networkError);
          throw new Error('Failed to change snap network to dev-testnet');
        }
      }

      setState(prev => ({ ...prev, loadingStep: 'Getting xpub from snap...' }));

      // Get xpub from snap
      console.log('🔍 Attempting to get xpub from snap...');

      let xpubResponse;
      try {
        xpubResponse = await invokeSnap({
          method: 'htr_getXpub',
          params: {}
        });
        console.log('✅ Raw xpub response from snap:', xpubResponse);
        console.log('📦 Response type:', typeof xpubResponse);
      } catch (snapError) {
        console.error('❌ Error calling snap htr_getXpub:', snapError);
        throw new Error(`Failed to get xpub: ${snapError instanceof Error ? snapError.message : String(snapError)}`);
      }

      // Parse the response if it's a string (snap returns stringified JSON)
      let parsedResponse = xpubResponse;
      if (typeof xpubResponse === 'string') {
        console.log('📝 Parsing stringified response...');
        try {
          parsedResponse = JSON.parse(xpubResponse);
          console.log('✅ Parsed response:', parsedResponse);
        } catch (parseError) {
          console.error('❌ Failed to parse response:', parseError);
          throw new Error('Invalid JSON response from snap');
        }
      }

      const xpub = parsedResponse?.response?.xpub;
      console.log('🔑 Extracted xpub:', xpub ? xpub.substring(0, 20) + '...' : 'null');

      if (!xpub) {
        console.error('❌ Failed to extract xpub from response:', parsedResponse);
        console.error('Response structure:', JSON.stringify(parsedResponse, null, 2));
        throw new Error('Failed to get xpub from snap - no xpub in response');
      }

      console.log('✅ Got xpub from snap:', xpub.substring(0, 20) + '...');
      setState(prev => ({ ...prev, loadingStep: 'Initializing read-only wallet...' }));

      // Web wallet always uses dev-testnet
      const network = 'dev-testnet';

      // Initialize read-only wallet with xpub
      await readOnlyWalletService.initialize(xpub, network);
      setState(prev => ({ ...prev, loadingStep: 'Loading wallet data...' }));

      // Get address from read-only wallet
      const addressInfo = readOnlyWalletService.getCurrentAddress();
      const address = addressInfo?.address || '';

      setState(prev => ({ ...prev, loadingStep: 'Loading balance...' }));

      // Get balance from read-only wallet
      const balances = await readOnlyWalletService.getBalance('00');
      console.log('💼 Wallet context received balances from read-only wallet:', balances);

      // Save xpub and network to localStorage for auto-reconnect
      localStorage.setItem(STORAGE_KEYS.XPUB, xpub);
      localStorage.setItem(STORAGE_KEYS.NETWORK, network);
      console.log('✅ Saved xpub to localStorage for auto-reconnect');

      setState(prev => ({
        ...prev,
        isConnected: true,
        address,
        balances,
        network,
        xpub,
        isConnecting: false,
        loadingStep: '',
      }));

      console.log('✅ Wallet state updated with balances:', balances);
    } catch (error) {
      console.error('Connection error:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        loadingStep: '',
        error: error instanceof Error ? error.message : 'Failed to connect to wallet',
      }));
    }
  };

  // Check for existing connection on mount
  React.useEffect(() => {
    checkExistingConnection();
  }, []);

  const disconnectWallet = () => {
    console.log('🔌 Disconnecting wallet...');

    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.XPUB);
    localStorage.removeItem(STORAGE_KEYS.NETWORK);

    // Stop the read-only wallet
    readOnlyWalletService.stop();

    // Reset state
    setState(initialState);

    console.log('✅ Wallet disconnected');
  };

  const refreshBalance = async () => {
    if (!state.isConnected || !readOnlyWalletService.isReady()) return;

    try {
      const balances = await readOnlyWalletService.getBalance('00');
      setState(prev => ({ ...prev, balances, error: null }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh balance',
      }));
    }
  };

  const refreshAddress = async () => {
    if (!state.isConnected || !readOnlyWalletService.isReady()) return;

    try {
      const addressInfo = readOnlyWalletService.getCurrentAddress();
      const address = addressInfo?.address || '';
      setState(prev => ({ ...prev, address, error: null }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh address',
      }));
    }
  };

  const getTransactionHistory = async (count: number = 10, skip: number = 0, tokenId: string = '00'): Promise<TransactionHistoryItem[]> => {
    if (!state.isConnected || !readOnlyWalletService.isReady()) {
      return [];
    }

    try {
      return await readOnlyWalletService.getTransactionHistory(count, skip, tokenId);
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  };

  const sendTransaction = async (params: SendTransactionParams) => {
    return await WalletServiceMethods.sendTransaction(invokeSnap, params);
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const contextValue: WalletContextType = {
    ...state,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    refreshAddress,
    getTransactionHistory,
    sendTransaction,
    setError,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
