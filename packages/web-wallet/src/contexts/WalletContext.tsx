import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WalletServiceMethods } from '../services/HathorWalletService';
import { useInvokeSnap, useRequestSnap } from 'snap-utils';

interface WalletBalance {
  token: string;
  available: number;
  locked: number;
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
}

interface WalletContextType extends WalletState {
  connectWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshAddress: () => Promise<void>;
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
};

const WalletContext = createContext<WalletContextType | null>(null);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [state, setState] = useState<WalletState>(initialState);
  const invokeSnap = useInvokeSnap();
  const requestSnap = useRequestSnap();

  // Check for existing connection on mount
  const checkExistingConnection = async () => {
    try {
      setState(prev => ({ ...prev, loadingStep: 'Checking existing connection...' }));

      // Use batch request to load all wallet data at once with a single approval
      const { address, balances, network } = await WalletServiceMethods.batchWalletInit(invokeSnap, ['00']);

      if (address) {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isCheckingConnection: false,
          address,
          balances,
          network,
          loadingStep: '',
        }));
      } else {
        // No existing connection
        setState(prev => ({
          ...prev,
          isCheckingConnection: false,
          loadingStep: '',
        }));
      }
    } catch (error) {
      // No existing connection, that's fine
      setState(prev => ({
        ...prev,
        isCheckingConnection: false,
        loadingStep: '',
      }));
    }
  };

  const connectWallet = async () => {
    setState(prev => ({ ...prev, isConnecting: true, loadingStep: 'Requesting snap...', error: null }));

    try {
      // Request the snap to install/activate it
      await requestSnap();
      setState(prev => ({ ...prev, loadingStep: 'Loading wallet data...' }));

      // Use batch request to load all wallet data at once with a single approval
      const { address, balances, network } = await WalletServiceMethods.batchWalletInit(invokeSnap, ['00']);

      setState(prev => ({
        ...prev,
        isConnected: true,
        address,
        balances,
        network,
        isConnecting: false,
        loadingStep: '',
      }));

      console.log('Wallet connected via batch request:', { address, balances, network });
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

  const refreshBalance = async () => {
    if (!state.isConnected) return;

    try {
      const balances = await WalletServiceMethods.getBalance(invokeSnap, ['00']);
      setState(prev => ({ ...prev, balances, error: null }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh balance',
      }));
    }
  };

  const refreshAddress = async () => {
    if (!state.isConnected) return;

    try {
      const address = await WalletServiceMethods.getAddress(invokeSnap, 'index', 0);
      setState(prev => ({ ...prev, address, error: null }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh address',
      }));
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
    refreshBalance,
    refreshAddress,
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
