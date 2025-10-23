import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { WalletServiceMethods } from '../services/HathorWalletService';
import { readOnlyWalletService } from '../services/ReadOnlyWalletService';
import { useInvokeSnap, useRequestSnap, useMetaMaskContext } from '@hathor/snap-utils';

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
  changeNetwork: (newNetwork: string) => Promise<void>;
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
  const { error: metamaskError, setError: setMetamaskError } = useMetaMaskContext();

  // Check for existing connection on mount
  const checkExistingConnection = async () => {
    // Prevent concurrent calls using functional state update for atomicity
    let shouldProceed = false;
    setState(prev => {
      if (prev.isCheckingConnection) {
        console.log('Already checking connection, skipping...');
        return prev; // Already checking, don't proceed
      }
      shouldProceed = true;
      return { ...prev, isCheckingConnection: true, loadingStep: 'Checking existing connection...' };
    });

    if (!shouldProceed) {
      return;
    }

    try {

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
      // Don't catch errors here - if network check fails, don't proceed with wallet initialization
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
      let address = '';
      try {
        const addressInfo = readOnlyWalletService.getCurrentAddress();
        address = addressInfo?.address || '';
      } catch (addressError) {
        console.error('Failed to get current address during auto-reconnect:', addressError);
        throw new Error('Failed to retrieve wallet address. The wallet may not be properly initialized.');
      }

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
      setState(prev => ({ ...prev, isCheckingConnection: false }));
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
      let address = '';
      try {
        const addressInfo = readOnlyWalletService.getCurrentAddress();
        address = addressInfo?.address || '';
      } catch (addressError) {
        console.error('Failed to get current address during wallet connection:', addressError);
        throw new Error('Failed to retrieve wallet address. The wallet may not be properly initialized.');
      }

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

      // Provide more specific error messages based on which step failed
      let errorMessage = 'Failed to connect to wallet';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setState(prev => ({
        ...prev,
        isConnecting: false,
        loadingStep: '',
        error: errorMessage,
      }));
    }
  };

  // Check for existing connection on mount
  React.useEffect(() => {
    checkExistingConnection();
  }, []);

  // Sync MetaMask errors to wallet state
  React.useEffect(() => {
    if (metamaskError) {
      console.error('MetaMask RPC Error:', metamaskError);
      setState(prev => ({
        ...prev,
        error: metamaskError.message || 'An RPC error occurred',
      }));
    }
  }, [metamaskError]);

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
      console.error('Failed to refresh address:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh address. The wallet may not be properly initialized.',
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

  const changeNetwork = async (newNetwork: string) => {
    if (!state.isConnected || !state.xpub) {
      console.error('Cannot change network: wallet not connected');
      return;
    }

    // Save current state for rollback
    const previousNetwork = state.network;
    const previousAddress = state.address;
    const previousBalances = state.balances;

    try {
      // Show loading screen by setting isCheckingConnection and loadingStep
      setState(prev => ({
        ...prev,
        isCheckingConnection: true,
        loadingStep: 'Changing network...',
        error: null
      }));

      // Call snap to change network
      await invokeSnap({
        method: 'htr_changeNetwork',
        params: {
          network: previousNetwork,
          newNetwork: newNetwork,
        }
      });

      console.log(`✅ Network changed from ${previousNetwork} to ${newNetwork}`);

      setState(prev => ({ ...prev, loadingStep: 'Stopping previous wallet...' }));

      // Stop the old read-only wallet
      if (readOnlyWalletService.isReady()) {
        await readOnlyWalletService.stop();
      }

      setState(prev => ({ ...prev, loadingStep: 'Initializing wallet on new network...' }));

      // Reinitialize read-only wallet with new network
      await readOnlyWalletService.initialize(state.xpub, newNetwork);

      setState(prev => ({ ...prev, loadingStep: 'Loading wallet data...' }));

      // Get fresh data from the new network
      let address = '';
      try {
        const addressInfo = readOnlyWalletService.getCurrentAddress();
        address = addressInfo?.address || '';
      } catch (addressError) {
        console.error('Failed to get current address after network change:', addressError);
        throw new Error('Failed to retrieve wallet address on new network. The wallet may not be properly initialized.');
      }

      const balances = await readOnlyWalletService.getBalance('00');

      // Update localStorage with new network
      localStorage.setItem(STORAGE_KEYS.NETWORK, newNetwork);

      setState(prev => ({
        ...prev,
        network: newNetwork,
        address,
        balances,
        isCheckingConnection: false,
        loadingStep: '',
        error: null,
      }));

      console.log('✅ Wallet reinitialized with new network');
    } catch (error) {
      console.error('❌ Failed to change network:', error);

      // Rollback to previous network
      try {
        console.log(`🔄 Rolling back to previous network: ${previousNetwork}`);
        setState(prev => ({ ...prev, loadingStep: 'Rolling back to previous network...' }));

        // Change snap back to previous network
        await invokeSnap({
          method: 'htr_changeNetwork',
          params: {
            network: newNetwork,
            newNetwork: previousNetwork,
          }
        });

        // Stop wallet if it was initialized
        if (readOnlyWalletService.isReady()) {
          await readOnlyWalletService.stop();
        }

        // Reinitialize with previous network
        await readOnlyWalletService.initialize(state.xpub, previousNetwork);

        // Restore previous state
        setState(prev => ({
          ...prev,
          network: previousNetwork,
          address: previousAddress,
          balances: previousBalances,
          isCheckingConnection: false,
          loadingStep: '',
          error: error instanceof Error ? error.message : 'Failed to change network. Reverted to previous network.',
        }));

        console.log('✅ Successfully rolled back to previous network');
      } catch (rollbackError) {
        console.error('❌ Failed to rollback:', rollbackError);
        // Rollback failed - wallet state is now inconsistent
        // Force disconnect to prevent user from operating in unknown state
        console.warn('🔴 Forcing wallet disconnect due to failed rollback');

        // Clear localStorage and stop wallet
        localStorage.removeItem(STORAGE_KEYS.XPUB);
        localStorage.removeItem(STORAGE_KEYS.NETWORK);

        try {
          await readOnlyWalletService.stop();
        } catch (stopError) {
          console.error('CRITICAL: Failed to cleanup wallet during forced disconnect:', stopError);
        }

        // Verify wallet is fully stopped to prevent memory leaks
        if (readOnlyWalletService.isReady()) {
          console.error('CRITICAL: Wallet still active after stop attempt - possible resource leak');
        }

        // Reset to disconnected state
        setState({
          ...initialState,
          isCheckingConnection: false,
          error: 'Network change failed. Wallet has been disconnected. Please reconnect.',
        });
      }
    }
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
    // Also clear MetaMask error when manually setting error to null
    if (error === null) {
      setMetamaskError(null);
    }
  };

  const contextValue: WalletContextType = {
    ...state,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    refreshAddress,
    getTransactionHistory,
    sendTransaction,
    changeNetwork,
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
