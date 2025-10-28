import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { WalletServiceMethods } from '../services/HathorWalletService';
import { readOnlyWalletService } from '../services/ReadOnlyWalletService';
import { useInvokeSnap, useRequestSnap, useMetaMaskContext } from '@hathor/snap-utils';

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
  refreshAddress: () => void;
  getTransactionHistory: (count?: number, skip?: number, tokenId?: string) => Promise<TransactionHistoryItem[]>;
  sendTransaction: (params: SendTransactionParams) => Promise<unknown>;
  changeNetwork: (newNetwork: string) => Promise<void>;
  setError: (error: string | null) => void;
}

const initialState: WalletState = {
  isConnected: false,
  isConnecting: false,
  isCheckingConnection: false,
  loadingStep: '',
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
  const isCheckingRef = React.useRef(false);

  const checkExistingConnection = async () => {
    if (isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;

    setState(prev => ({
      ...prev,
      isCheckingConnection: true,
      loadingStep: 'Checking existing connection...',
    }));

    try {
      const storedXpub = localStorage.getItem(STORAGE_KEYS.XPUB);
      const storedNetwork = localStorage.getItem(STORAGE_KEYS.NETWORK) || 'dev-testnet';

      if (!storedXpub) {
        setState(prev => ({
          ...prev,
          isCheckingConnection: false,
          loadingStep: '',
        }));
        return;
      }

      setState(prev => ({ ...prev, loadingStep: 'Checking snap network...' }));
      const networkTest = await invokeSnap({
        method: 'htr_getConnectedNetwork',
        params: {}
      });
      const parsedNetworkTest = typeof networkTest === 'string' ? JSON.parse(networkTest) : networkTest;
      const currentSnapNetwork = parsedNetworkTest?.response?.network;
      const targetNetwork = 'dev-testnet';

      if (currentSnapNetwork !== targetNetwork) {
        setState(prev => ({ ...prev, loadingStep: 'Changing snap network to dev-testnet...' }));

        await invokeSnap({
          method: 'htr_changeNetwork',
          params: {
            network: currentSnapNetwork,
            newNetwork: targetNetwork
          }
        });
      }

      setState(prev => ({ ...prev, loadingStep: 'Initializing read-only wallet...' }));

      if (readOnlyWalletService.isReady()) {
        await readOnlyWalletService.stop();
      }
      await readOnlyWalletService.initialize(storedXpub, storedNetwork);

      setState(prev => ({ ...prev, loadingStep: 'Loading wallet data...' }));

      let address = '';
      try {
        const addressInfo = readOnlyWalletService.getCurrentAddress();
        address = addressInfo?.address || '';
      } catch (addressError) {
        throw new Error('Failed to retrieve wallet address. The wallet may not be properly initialized.');
      }

      const balances = await readOnlyWalletService.getBalance('00');

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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const shouldClearStorage =
        errorMessage.includes('Invalid xpub') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('unauthorized');

      if (shouldClearStorage) {
        localStorage.removeItem(STORAGE_KEYS.XPUB);
        localStorage.removeItem(STORAGE_KEYS.NETWORK);
      }

      setState(prev => ({
        ...prev,
        isCheckingConnection: false,
        loadingStep: '',
        error: 'Failed to reconnect. Please try connecting manually.',
      }));
    } finally {
      isCheckingRef.current = false;
      setState(prev => ({ ...prev, isCheckingConnection: false }));
    }
  };

  const connectWallet = async () => {
    setState(prev => ({ ...prev, isConnecting: true, loadingStep: 'Requesting snap...', error: null }));

    try {
      await requestSnap();
      setState(prev => ({ ...prev, loadingStep: 'Checking snap network...' }));

      let currentSnapNetwork;
      try {
        const networkTest = await invokeSnap({
          method: 'htr_getConnectedNetwork',
          params: {}
        });

        const parsedNetworkTest = typeof networkTest === 'string' ? JSON.parse(networkTest) : networkTest;
        currentSnapNetwork = parsedNetworkTest?.response?.network;
      } catch (testError) {
        throw new Error('Snap is not responding. Please make sure it is installed correctly.');
      }

      const targetNetwork = 'dev-testnet';
      if (currentSnapNetwork !== targetNetwork) {
        setState(prev => ({ ...prev, loadingStep: 'Changing snap network to dev-testnet...' }));

        try {
          await invokeSnap({
            method: 'htr_changeNetwork',
            params: {
              network: currentSnapNetwork,
              newNetwork: targetNetwork
            }
          });
        } catch (networkError) {
          throw new Error('Failed to change snap network to dev-testnet');
        }
      }

      setState(prev => ({ ...prev, loadingStep: 'Getting xpub from snap...' }));

      let xpubResponse;
      try {
        xpubResponse = await invokeSnap({
          method: 'htr_getXpub',
          params: {}
        });
      } catch (snapError) {
        throw new Error(`Failed to get xpub: ${snapError instanceof Error ? snapError.message : String(snapError)}`);
      }

      let parsedResponse = xpubResponse;
      if (typeof xpubResponse === 'string') {
        try {
          parsedResponse = JSON.parse(xpubResponse);
        } catch (parseError) {
          throw new Error('Invalid JSON response from snap');
        }
      }

      const xpub = (parsedResponse as { response?: { xpub?: string } })?.response?.xpub;

      if (!xpub) {
        throw new Error('Failed to get xpub from snap - no xpub in response');
      }

      setState(prev => ({ ...prev, loadingStep: 'Initializing read-only wallet...' }));

      const network = 'dev-testnet';
      await readOnlyWalletService.initialize(xpub, network);
      setState(prev => ({ ...prev, loadingStep: 'Loading wallet data...' }));

      let address = '';
      try {
        const addressInfo = readOnlyWalletService.getCurrentAddress();
        address = addressInfo?.address || '';
      } catch (addressError) {
        throw new Error('Failed to retrieve wallet address. The wallet may not be properly initialized.');
      }

      setState(prev => ({ ...prev, loadingStep: 'Loading balance...' }));

      const balances = await readOnlyWalletService.getBalance('00');

      localStorage.setItem(STORAGE_KEYS.XPUB, xpub);
      localStorage.setItem(STORAGE_KEYS.NETWORK, network);

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
    } catch (error) {
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

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const timer = setTimeout(() => {
      timeoutId = setTimeout(() => {
        setState(prev => ({
          ...prev,
          isCheckingConnection: false,
          loadingStep: '',
          error: null,
        }));
      }, 10000);

      checkExistingConnection()
        .then(() => {})
        .catch(() => {
          setState(prev => ({
            ...prev,
            isCheckingConnection: false,
            loadingStep: '',
            error: 'Failed to check connection',
          }));
        })
        .finally(() => {
          clearTimeout(timeoutId);
        });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  React.useEffect(() => {
    if (metamaskError) {
      setState(prev => ({
        ...prev,
        error: metamaskError.message || 'An RPC error occurred',
      }));
    }
  }, [metamaskError]);

  const disconnectWallet = () => {
    localStorage.removeItem(STORAGE_KEYS.XPUB);
    localStorage.removeItem(STORAGE_KEYS.NETWORK);
    readOnlyWalletService.stop();
    setState(initialState);
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

  const refreshAddress = () => {
    if (!state.isConnected || !readOnlyWalletService.isReady()) return;

    try {
      const addressInfo = readOnlyWalletService.getCurrentAddress();
      const address = addressInfo?.address || '';
      setState(prev => ({ ...prev, address, error: null }));
    } catch (error) {
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
      return [];
    }
  };

  const sendTransaction = async (params: SendTransactionParams) => {
    return await WalletServiceMethods.sendTransaction(invokeSnap, params);
  };

  const changeNetwork = async (newNetwork: string) => {
    if (!state.isConnected || !state.xpub) {
      return;
    }

    const previousNetwork = state.network;
    const previousAddress = state.address;
    const previousBalances = state.balances;

    try {
      setState(prev => ({
        ...prev,
        isCheckingConnection: true,
        loadingStep: 'Changing network...',
        error: null
      }));

      await invokeSnap({
        method: 'htr_changeNetwork',
        params: {
          network: previousNetwork,
          newNetwork: newNetwork,
        }
      });

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

    } catch (error) {
      console.error('Failed to change network:', error);

      try {
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
      } catch (rollbackError) {
        console.error('Failed to rollback:', rollbackError);
        console.warn('Forcing wallet disconnect due to failed rollback');

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
