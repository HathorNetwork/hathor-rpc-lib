/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react';
import { useInvokeSnap, useRequestSnap, useMetaMaskContext } from '@hathor/snap-utils';
import { ConnectionLostModal } from '../components/ConnectionLostModal';
import type { TransactionHistoryItem } from '../types/wallet';
import type { TokenFilter, DagMetadata } from '../types/token';
import type { AddressMode } from '../utils/addressMode';

// Import all our custom hooks
import { useAddressMode } from './hooks/useAddressMode';
import { useWalletBalance } from './hooks/useWalletBalance';
import { useTokenManagement } from './hooks/useTokenManagement';
import { useTransactions, type SendTransactionParams } from './hooks/useTransactions';
import { useWalletConnection } from './hooks/useWalletConnection';
import { useNetworkManagement } from './hooks/useNetworkManagement';

// Re-export types for external use
export type { TransactionHistoryItem, SendTransactionParams };

interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  isCheckingConnection: boolean;
  loadingStep: string;
  address: string;
  balances: Array<{ token: string; available: bigint; locked: bigint }>;
  network: string;
  error: string | null;
  xpub: string | null;
  isHistoryDialogOpen: boolean;
  currentHistoryPage: number;
  newTransaction: unknown | null;
  registeredTokens: Array<{
    uid: string;
    name: string;
    symbol: string;
    balance?: { available: bigint; locked: bigint };
    isNFT: boolean;
    metadata?: DagMetadata;
    configString?: string;
    registeredAt?: number;
  }>;
  selectedTokenFilter: TokenFilter;
  selectedTokenForSend: string | null;
  addressMode: AddressMode;
}

interface WalletContextType extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
  refreshAddress: () => Promise<void>;
  getTransactionHistory: (count?: number, skip?: number, tokenId?: string) => Promise<TransactionHistoryItem[]>;
  sendTransaction: (params: SendTransactionParams) => Promise<unknown>;
  changeNetwork: (newNetwork: string) => Promise<void>;
  setError: (error: string | null) => void;
  setHistoryDialogState: (isOpen: boolean, page?: number) => void;
  clearNewTransaction: () => void;
  registerToken: (configString: string) => Promise<void>;
  unregisterToken: (tokenUid: string) => Promise<void>;
  refreshTokenBalances: () => Promise<void>;
  setSelectedTokenFilter: (filter: TokenFilter) => void;
  getTokenBalance: (tokenUid: string) => ReturnType<ReturnType<typeof useTokenManagement>['getTokenBalance']>;
  setAddressMode: (mode: AddressMode) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const invokeSnap = useInvokeSnap();
  const requestSnap = useRequestSnap();
  const { error: metamaskError } = useMetaMaskContext();

  const [showConnectionLostModal, setShowConnectionLostModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize address mode hook
  const { addressMode, setAddressMode: setAddressModeImpl } = useAddressMode({
    onError: setError,
    onAddressUpdate: (newAddress) => {
      // Update connection hook's address
      connection.setAddress(newAddress);
    },
  });

  // Initialize connection hook
  const connection = useWalletConnection({
    addressMode,
    invokeSnap,
    requestSnap,
    metamaskError,
    onRefreshBalance: async () => {
      await balance.refreshBalance();
    },
    onError: setError,
    onShowConnectionLostModal: setShowConnectionLostModal,
  });

  // Initialize balance hook
  const balance = useWalletBalance({
    isConnected: connection.isConnected,
    addressMode,
    onRefreshTokenBalances: async () => {
      await tokens.refreshTokenBalances();
    },
    onError: setError,
  });

  // Initialize token management hook
  const tokens = useTokenManagement({
    isConnected: connection.isConnected,
    network: connection.network,
  });

  // Initialize transactions hook
  const transactions = useTransactions({
    isConnected: connection.isConnected,
    invokeSnap,
    onError: setError,
    onSnapError: connection.handleSnapError,
  });

  // Initialize network management hook
  const networkManagement = useNetworkManagement({
    isConnected: connection.isConnected,
    xpub: connection.xpub,
    network: connection.network,
    address: connection.address,
    balances: connection.balances,
    addressMode,
    invokeSnap,
    onSetupEventListeners: () => {
      // Setup event listeners (this would be handled by connection hook)
    },
    onSnapError: connection.handleSnapError,
    onNetworkChange: ({ network, address, balances, tokens: newTokens, warning }) => {
      connection.setNetwork(network);
      connection.setAddress(address);
      connection.setBalances(balances);
      connection.setRegisteredTokens(newTokens);
      setError(warning);
    },
    onLoadingChange: () => {
      // Loading state is managed internally by connection hook
      // We could expose setters if needed
    },
    onError: setError,
    onForceDisconnect: () => {
      connection.disconnectWallet();
    },
  });

  // Aggregate state from all hooks
  const contextValue: WalletContextType = {
    // Connection state
    isConnected: connection.isConnected,
    isConnecting: connection.isConnecting,
    isCheckingConnection: connection.isCheckingConnection,
    loadingStep: connection.loadingStep,
    xpub: connection.xpub,
    network: connection.network,

    // Balance state
    address: balance.address || connection.address,
    balances: balance.balances.length > 0 ? balance.balances : connection.balances,

    // Token state
    registeredTokens: tokens.registeredTokens.length > 0 ? tokens.registeredTokens : connection.registeredTokens,
    selectedTokenFilter: tokens.selectedTokenFilter,
    selectedTokenForSend: null, // This was removed in refactor

    // Transaction state
    isHistoryDialogOpen: transactions.isHistoryDialogOpen,
    currentHistoryPage: transactions.currentHistoryPage,
    newTransaction: transactions.newTransaction,

    // Address mode
    addressMode,

    // Error state
    error,

    // Connection methods
    connectWallet: connection.connectWallet,
    disconnectWallet: connection.disconnectWallet,

    // Balance methods
    refreshBalance: balance.refreshBalance,
    refreshAddress: balance.refreshAddress,

    // Transaction methods
    getTransactionHistory: transactions.getTransactionHistory,
    sendTransaction: transactions.sendTransaction,
    setHistoryDialogState: transactions.setHistoryDialogState,
    clearNewTransaction: transactions.clearNewTransaction,

    // Token methods
    registerToken: tokens.registerToken,
    unregisterToken: tokens.unregisterToken,
    refreshTokenBalances: tokens.refreshTokenBalances,
    setSelectedTokenFilter: tokens.setSelectedTokenFilter,
    getTokenBalance: tokens.getTokenBalance,

    // Network methods
    changeNetwork: networkManagement.changeNetwork,

    // Address mode methods
    setAddressMode: setAddressModeImpl,

    // Error methods
    setError,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
      <ConnectionLostModal
        isOpen={showConnectionLostModal}
        onReconnect={connection.handleReconnect}
      />
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
