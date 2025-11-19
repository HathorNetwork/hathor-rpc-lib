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
  /**
   * User-facing error message for recoverable errors.
   *
   * This state provides centralized error management for displaying transient,
   * non-fatal errors to users via toast notifications. It is distinct from:
   *
   * - **ErrorBoundary**: Catches unhandled React render errors that crash components,
   *   showing a full-page fallback requiring reload. Use for catastrophic failures.
   *
   * - **WalletContext error state**: Handles expected, recoverable errors from async
   *   operations (network requests, snap communication, etc.). Shows dismissible toast
   *   notifications without disrupting the UI. Use for operational errors that users
   *   can recover from.
   *
   * - **Console errors**: Logged for debugging but not shown to users. Use for
   *   technical details that don't require user action.
   *
   * **When to use this error state:**
   * - Connection failures (MetaMask RPC errors, snap communication issues)
   * - Failed async operations (balance refresh, transaction history fetch)
   * - Network switching errors with rollback capability
   * - Settings persistence failures
   * - Warning messages (e.g., token loading warnings)
   * - Any user-actionable error that doesn't require app restart
   *
   * **How to use:**
   * - Set via `setError(message)` to display error notification
   * - Clear via `setError(null)` when error is dismissed or resolved
   * - Error automatically displayed by ErrorNotification component in WalletHome
   */
  error: string | null;
  xpub: string | null;
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
  /**
   * Establishes connection to the Hathor wallet via MetaMask Snap.
   *
   * This method initiates the wallet connection process, which includes:
   * - Requesting snap permissions from MetaMask
   * - Initializing wallet state (xpub, address, balances)
   * - Loading registered tokens from storage
   * - Setting up event listeners for wallet updates
   *
   * The connection process updates `isConnecting` and `loadingStep` state to provide
   * user feedback during the multi-step initialization.
   *
   * @throws {Error} If snap is not installed, user denies permission, or initialization fails
   *
   * @example
   * ```ts
   * await connectWallet();
   * // isConnected will be true, address and balances will be populated
   * ```
   */
  connectWallet: () => Promise<void>;

  /**
   * Disconnects from the wallet and resets all wallet state.
   *
   * This method performs a complete cleanup:
   * - Clears all wallet data (address, balances, tokens)
   * - Removes event listeners
   * - Resets connection state
   * - Does NOT revoke snap permissions (user must do this in MetaMask)
   *
   * Use this when user explicitly wants to disconnect or when switching wallets.
   *
   * @example
   * ```ts
   * disconnectWallet();
   * // isConnected will be false, all wallet data cleared
   * ```
   */
  disconnectWallet: () => void;

  /**
   * Refreshes wallet balances for all registered tokens.
   *
   * Fetches the latest balance information from the blockchain for both HTR and
   * all registered custom tokens. Updates the `balances` state with current
   * available and locked amounts.
   *
   * This is automatically called after transactions, but can be manually triggered
   * to ensure data freshness.
   *
   * @throws {Error} If wallet is not connected or balance fetch fails
   *
   * @example
   * ```ts
   * await refreshBalance();
   * // balances array will contain updated values
   * ```
   */
  refreshBalance: () => Promise<void>;

  /**
   * Refreshes the current wallet address based on the active address mode.
   *
   * Re-fetches the current address from the wallet, respecting the current
   * address mode (standard or change addresses). Use this when address mode
   * changes or to ensure address is up-to-date.
   *
   * @throws {Error} If wallet is not properly initialized or address fetch fails
   *
   * @example
   * ```ts
   * await refreshAddress();
   * // address state will be updated with current address
   * ```
   */
  refreshAddress: () => Promise<void>;

  /**
   * Retrieves paginated transaction history for the wallet or a specific token.
   *
   * Fetches transaction records from the blockchain with pagination support.
   * Can be filtered to show only transactions for a specific token.
   *
   * @param count - Number of transactions to fetch (default: 10)
   * @param skip - Number of transactions to skip for pagination (default: 0)
   * @param tokenId - Optional token UID to filter transactions (omit for HTR)
   * @returns Array of transaction history items with details like amounts, timestamps, addresses
   *
   * @throws {Error} If wallet is not connected or history fetch fails
   *
   * @example
   * ```ts
   * // Get first 20 HTR transactions
   * const txs = await getTransactionHistory(20, 0);
   *
   * // Get next page of custom token transactions
   * const tokenTxs = await getTransactionHistory(10, 10, 'token-uid');
   * ```
   */
  getTransactionHistory: (count?: number, skip?: number, tokenId?: string) => Promise<TransactionHistoryItem[]>;

  /**
   * Sends a transaction from the wallet.
   *
   * Creates and broadcasts a transaction to the Hathor network. Handles both
   * HTR and custom token transfers. The transaction requires user approval
   * via MetaMask Snap.
   *
   * On success, updates `newTransaction` state to trigger notification display.
   *
   * @param params - Transaction parameters including recipient address, amount, and token
   * @returns Transaction result object with tx_id and other metadata
   *
   * @throws {Error} If user rejects transaction, insufficient balance, or broadcast fails
   *
   * @example
   * ```ts
   * const result = await sendTransaction({
   *   address: 'H9aP2...',
   *   amount: 100n,
   *   token: 'HTR'
   * });
   * // newTransaction state updated, notification shown
   * ```
   */
  sendTransaction: (params: SendTransactionParams) => Promise<unknown>;

  /**
   * Switches the wallet to a different Hathor network.
   *
   * Changes between mainnet, testnet, or custom networks. This operation:
   * - Reinitializes the wallet on the new network
   * - Fetches new address and balances
   * - Reloads registered tokens (some may not exist on new network)
   * - Implements rollback if network change fails
   *
   * Network change requires user confirmation and may display warnings if tokens
   * are missing on the target network.
   *
   * @param newNetwork - Network identifier (e.g., 'mainnet', 'testnet')
   *
   * @throws {Error} If network change fails (will attempt rollback to previous network)
   *
   * @example
   * ```ts
   * await changeNetwork('testnet');
   * // Wallet now connected to testnet, all data refreshed
   * ```
   */
  changeNetwork: (newNetwork: string) => Promise<void>;
  /**
   * Sets or clears the user-facing error message.
   *
   * This method controls the error notification displayed to users. It should be used
   * for recoverable errors that users need to be aware of but can dismiss.
   *
   * **When to call:**
   * - After catching expected errors from async operations (API calls, snap requests)
   * - When operations fail but the app can continue functioning
   * - To display warning messages that don't prevent user actions
   * - To clear errors after user dismisses notification or when starting new operations
   *
   * **When NOT to call:**
   * - For errors that should crash the component (let ErrorBoundary handle those)
   * - For debug information (use console.error instead)
   * - For errors already handled by error boundaries in child components
   *
   * @param error - Error message to display, or null to clear the current error
   *
   * @example
   * ```ts
   * try {
   *   await someAsyncOperation();
   * } catch (error) {
   *   setError(error instanceof Error ? error.message : 'Operation failed');
   * }
   *
   * // Clear error when starting new operation
   * setError(null);
   * await newOperation();
   * ```
   */
  setError: (error: string | null) => void;

  /**
   * Clears the new transaction notification state.
   *
   * Dismisses the transaction success notification after a transaction is sent.
   * This is typically called when the user closes the notification or after
   * the auto-dismiss timeout.
   *
   * @example
   * ```ts
   * clearNewTransaction();
   * // newTransaction state set to null, notification hidden
   * ```
   */
  clearNewTransaction: () => void;

  /**
   * Registers a custom token to the wallet using its configuration string.
   *
   * Adds a new custom token to the wallet for tracking and transactions. The
   * configuration string contains token metadata (UID, name, symbol). Registered
   * tokens are:
   * - Persisted to localStorage
   * - Displayed in the token list
   * - Included in balance refreshes
   * - Available for sending transactions
   *
   * @param configString - Token configuration string (format: "uid:name:symbol")
   *
   * @throws {Error} If configuration string is invalid or token already registered
   *
   * @example
   * ```ts
   * await registerToken('00abc123:MyToken:MTK');
   * // Token now appears in registeredTokens array
   * ```
   */
  registerToken: (configString: string) => Promise<void>;

  /**
   * Removes a custom token from the wallet.
   *
   * Unregisters a previously registered token, removing it from:
   * - The token list display
   * - Balance tracking
   * - localStorage persistence
   *
   * HTR (native token) cannot be unregistered. This operation does not affect
   * blockchain state, only local wallet configuration.
   *
   * @param tokenUid - Unique identifier of the token to remove
   *
   * @throws {Error} If attempting to unregister HTR or token not found
   *
   * @example
   * ```ts
   * await unregisterToken('00abc123');
   * // Token removed from registeredTokens array
   * ```
   */
  unregisterToken: (tokenUid: string) => Promise<void>;

  /**
   * Refreshes balances for all registered custom tokens.
   *
   * Updates balance information specifically for custom tokens (non-HTR tokens).
   * This is lighter weight than `refreshBalance()` as it only fetches token
   * balances, not the full wallet state.
   *
   * Automatically called after token registration/unregistration.
   *
   * @throws {Error} If wallet is not connected or balance fetch fails
   *
   * @example
   * ```ts
   * await refreshTokenBalances();
   * // All registered token balances updated
   * ```
   */
  refreshTokenBalances: () => Promise<void>;

  /**
   * Sets the active filter for the token list display.
   *
   * Controls which tokens are visible in the UI:
   * - 'all': Show all registered tokens
   * - 'tokens': Show only fungible tokens
   * - 'nfts': Show only NFTs
   *
   * This is a UI-only filter that does not affect wallet functionality.
   *
   * @param filter - Token filter to apply
   *
   * @example
   * ```ts
   * setSelectedTokenFilter('nfts');
   * // Token list now shows only NFTs
   * ```
   */
  setSelectedTokenFilter: (filter: TokenFilter) => void;

  /**
   * Retrieves balance information for a specific token.
   *
   * Returns the current available and locked balances for a given token UID.
   * Useful for displaying individual token balances in UI components.
   *
   * @param tokenUid - Unique identifier of the token
   * @returns Object containing available and locked balance amounts, or undefined if token not found
   *
   * @example
   * ```ts
   * const balance = getTokenBalance('00abc123');
   * if (balance) {
   *   console.log(`Available: ${balance.available}, Locked: ${balance.locked}`);
   * }
   * ```
   */
  getTokenBalance: (tokenUid: string) => ReturnType<ReturnType<typeof useTokenManagement>['getTokenBalance']>;

  /**
   * Changes the address mode for the wallet.
   *
   * Switches between different address derivation modes:
   * - Standard addresses: Normal receiving addresses
   * - Change addresses: Addresses used for transaction change outputs
   *
   * Changing address mode:
   * - Updates the current displayed address
   * - Persists preference to localStorage
   * - May affect which addresses are shown in transaction history
   *
   * @param mode - Address mode to activate
   *
   * @throws {Error} If address mode change fails or preference cannot be saved
   *
   * @example
   * ```ts
   * await setAddressMode('change');
   * // address state updated to show change address
   * ```
   */
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
