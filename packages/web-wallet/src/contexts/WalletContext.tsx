import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { WalletServiceMethods, SnapUnauthorizedError } from '../services/HathorWalletService';
import { readOnlyWalletService } from '../services/ReadOnlyWalletService';
import { useInvokeSnap, useRequestSnap, useMetaMaskContext } from '@hathor/snap-utils';
import { DEFAULT_NETWORK, TOKEN_IDS } from '@/constants';
import type { TokenInfo, TokenFilter } from '../types/token';
import type { WalletBalance, TransactionHistoryItem } from '../types/wallet';
import { tokenRegistryService } from '../services/TokenRegistryService';
import { loadAddressMode, saveAddressMode, getDisplayAddressForMode, type AddressMode } from '../utils/addressMode';
import { toBigInt } from '../utils/hathor';
import { ConnectionLostModal } from '../components/ConnectionLostModal';
import { SNAP_TIMEOUTS } from '../constants/timeouts';
import { createLogger } from '../utils/logger';
import { loadTokensWithBalances, fetchTokenBalance } from '../utils/tokenLoading';

// Re-export types for external use
export type { TransactionHistoryItem };

const STORAGE_KEYS = {
  XPUB: 'hathor_wallet_xpub',
  NETWORK: 'hathor_wallet_network',
};

const log = createLogger('WalletContext');

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
  isHistoryDialogOpen: boolean;
  currentHistoryPage: number;
  newTransaction: unknown | null;
  registeredTokens: TokenInfo[];
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
  getTokenBalance: (tokenUid: string) => TokenInfo | undefined;
  setAddressMode: (mode: AddressMode) => Promise<void>;
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
  isHistoryDialogOpen: false,
  currentHistoryPage: 0,
  newTransaction: null,
  registeredTokens: [],
  selectedTokenFilter: 'tokens',
  selectedTokenForSend: null,
  addressMode: loadAddressMode().mode,
};

const WalletContext = createContext<WalletContextType | null>(null);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [state, setState] = useState<WalletState>(initialState);
  const [showConnectionLostModal, setShowConnectionLostModal] = useState(false);
  const invokeSnap = useInvokeSnap();
  const requestSnap = useRequestSnap();
  const { error: metamaskError, setError: setMetamaskError } = useMetaMaskContext();
  const isCheckingRef = React.useRef(false);

  // Helper function to set up event listeners
  const setupEventListeners = () => {
    // Remove all existing listeners to prevent duplicates
    readOnlyWalletService.removeAllListeners();

    // Register new listeners using stable ref wrapper
    readOnlyWalletService.on('new-tx', (tx) => handleNewTransactionRef.current(tx));
    readOnlyWalletService.on('update-tx', (tx) => handleNewTransactionRef.current(tx));
  };

  // Global error handler wrapper for snap calls
  const handleSnapError = (error: unknown) => {
    if (error instanceof SnapUnauthorizedError) {
      log.error('Snap unauthorized error detected - showing connection lost modal');
      setShowConnectionLostModal(true);
      throw error; // Re-throw for caller to handle
    }
    throw error; // Re-throw other errors
  };

  // Handler for reconnecting after connection lost
  const handleReconnect = () => {
    setShowConnectionLostModal(false);
    disconnectWallet();
    // Optionally trigger a page reload or navigation to home
    window.location.reload();
  };

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
      const storedNetwork = localStorage.getItem(STORAGE_KEYS.NETWORK) || DEFAULT_NETWORK;

      if (!storedXpub) {
        setState(prev => ({
          ...prev,
          isCheckingConnection: false,
          loadingStep: '',
        }));
        return;
      }

      // Verify snap is properly installed and enabled using wallet_getSnaps
      log.debug('Starting snap verification...');
      setState(prev => ({ ...prev, loadingStep: 'Verifying snap installation...' }));

      try {
        log.debug('Checking installed snaps via wallet_getSnaps...');

        // Use wallet_getSnaps to check if our snap is installed and enabled
        const snaps = await (window as { ethereum?: { request: (args: { method: string }) => Promise<unknown> } }).ethereum?.request({
          method: 'wallet_getSnaps',
        }) as Record<string, { version: string; enabled: boolean; blocked: boolean }> | undefined;

        log.debug('Installed snaps:', snaps);

        // Find our snap (using local:http://localhost:8080 for development)
        const snapId = 'local:http://localhost:8080';
        const ourSnap = snaps?.[snapId];

        if (!ourSnap) {
          log.error('Snap not found in installed snaps');
          throw new Error('Snap not installed');
        }

        log.debug('Snap found:', ourSnap);

        // Check if snap is enabled
        if (ourSnap.blocked) {
          log.error('Snap is blocked');
          throw new Error('Snap is blocked');
        }

        if (!ourSnap.enabled) {
          log.error('Snap is not enabled');
          throw new Error('Snap is disabled');
        }

        log.info('Snap is installed and enabled - version:', ourSnap.version);
        log.debug('Snap verification successful - snap is ready to use');
      } catch (snapError) {
        const errorMsg = snapError instanceof Error ? snapError.message : 'Unknown error';
        const errorCode = (snapError as { code?: number })?.code;

        log.error('Snap verification failed:', errorMsg);
        log.error('Error code:', errorCode);
        log.error('Full error:', snapError);

        // Clear stored data
        log.warn('Clearing stored wallet data...');
        localStorage.removeItem(STORAGE_KEYS.XPUB);
        localStorage.removeItem(STORAGE_KEYS.NETWORK);

        // Determine appropriate error message
        let userError = 'Snap connection lost. Please reconnect your wallet.';

        if (errorCode === 4100 || errorMsg.includes('Unauthorized') || errorMsg.includes('permission')) {
          userError = 'Snap permissions have changed. Please disconnect and reconnect your wallet.';
        } else if (errorMsg.includes('blocked')) {
          userError = 'Snap is blocked. Please enable it in MetaMask settings.';
        } else if (errorMsg.includes('disabled')) {
          userError = 'Snap is disabled. Please enable it in MetaMask settings.';
        } else if (errorMsg.includes('not installed')) {
          userError = 'Snap not installed. Please connect your wallet.';
        }

        setState(prev => ({
          ...prev,
          isCheckingConnection: false,
          loadingStep: '',
          error: userError,
        }));
        return;
      }

      setState(prev => ({ ...prev, loadingStep: 'Initializing read-only wallet...' }));

      if (readOnlyWalletService.isReady()) {
        await readOnlyWalletService.stop();
      }
      await readOnlyWalletService.initialize(storedXpub, storedNetwork);

      // Set up event listeners for real-time updates
      setupEventListeners();

      setState(prev => ({ ...prev, loadingStep: 'Loading wallet data...' }));

      let address = '';
      try {
        address = await getDisplayAddressForMode(loadAddressMode().mode, readOnlyWalletService);
      } catch {
        throw new Error('Failed to retrieve wallet address. The wallet may not be properly initialized.');
      }

      const balances = await readOnlyWalletService.getBalance(TOKEN_IDS.HTR);

      // Load registered tokens for this network
      const genesisHash = ''; // TODO: Get from RPC handler
      const tokenLoadResult = await loadTokensWithBalances(storedNetwork, genesisHash, {
        clearNftCache: true,
        detailedErrors: true,
      });

      setState(prev => ({
        ...prev,
        isConnected: true,
        isCheckingConnection: false,
        address,
        balances,
        network: storedNetwork,
        xpub: storedXpub,
        loadingStep: '',
        registeredTokens: tokenLoadResult.tokens,
        error: tokenLoadResult.warning,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if snap crashed
      const snapCrashed =
        errorMessage.includes('DataCloneError') ||
        errorMessage.includes('postMessage') ||
        errorMessage.includes('cloned') ||
        errorMessage.includes('timeout');

      const shouldClearStorage =
        snapCrashed ||
        errorMessage.includes('Invalid xpub') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('unauthorized');

      if (shouldClearStorage) {
        localStorage.removeItem(STORAGE_KEYS.XPUB);
        localStorage.removeItem(STORAGE_KEYS.NETWORK);
      }

      const userMessage = snapCrashed
        ? 'MetaMask Snap is not responding. Please refresh the page and try again.'
        : 'Failed to reconnect. Please try connecting manually.';

      setState(prev => ({
        ...prev,
        isCheckingConnection: false,
        loadingStep: '',
        error: userMessage,
      }));
    } finally {
      isCheckingRef.current = false;
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
      await requestSnap();
      setState(prev => ({ ...prev, loadingStep: 'Checking snap network...' }));

      let currentSnapNetwork;
      try {
        // Add timeout to network check
        const networkCheckPromise = invokeSnap({
          method: 'htr_getConnectedNetwork',
          params: {}
        });
        const networkCheckTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Network check timeout')), SNAP_TIMEOUTS.NETWORK_CHECK)
        );
        const networkTest = await Promise.race([networkCheckPromise, networkCheckTimeout]);

        let parsedNetworkTest;
        try {
          parsedNetworkTest = typeof networkTest === 'string' ? JSON.parse(networkTest) : networkTest;
        } catch (parseError) {
          console.error('Failed to parse network test response:', parseError, networkTest);
          throw new Error(`Snap returned invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Parse error'}`);
        }
        currentSnapNetwork = parsedNetworkTest?.response?.network;
      } catch (testError) {
        console.error(testError);
        throw new Error('Snap is not responding. Please make sure it is installed correctly.');
      }

      const targetNetwork = DEFAULT_NETWORK;
      if (currentSnapNetwork !== targetNetwork) {
        setState(prev => ({ ...prev, loadingStep: `Changing snap network to ${DEFAULT_NETWORK}...` }));

        try {
          // Add timeout to network change
          const changeNetworkPromise = invokeSnap({
            method: 'htr_changeNetwork',
            params: {
              network: currentSnapNetwork,
              newNetwork: targetNetwork
            }
          });
          const changeNetworkTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network change timeout')), SNAP_TIMEOUTS.NETWORK_CHANGE)
          );
          await Promise.race([changeNetworkPromise, changeNetworkTimeout]);
        } catch (networkError) {
          console.error(networkError);
          throw new Error(`Failed to change snap network to ${DEFAULT_NETWORK}`);
        }
      }

      setState(prev => ({ ...prev, loadingStep: 'Getting xpub from snap...' }));

      let xpubResponse;
      try {
        // Add timeout to getXpub call
        const xpubPromise = invokeSnap({
          method: 'htr_getXpub',
          params: {}
        });
        const xpubTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Get xpub timeout')), SNAP_TIMEOUTS.RPC_CALL)
        );
        xpubResponse = await Promise.race([xpubPromise, xpubTimeout]);
      } catch (snapError) {
        throw new Error(`Failed to get xpub: ${snapError instanceof Error ? snapError.message : String(snapError)}`);
      }

      let parsedResponse = xpubResponse;
      if (typeof xpubResponse === 'string') {
        try {
          parsedResponse = JSON.parse(xpubResponse);
        } catch (parseError) {
          console.error('Failed to parse xpub response:', parseError, xpubResponse);
          throw new Error(`Invalid JSON response from snap: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
        }
      }

      const xpub = (parsedResponse as { response?: { xpub?: string } })?.response?.xpub;

      if (!xpub) {
        throw new Error('Failed to get xpub from snap - no xpub in response');
      }

      setState(prev => ({ ...prev, loadingStep: 'Initializing read-only wallet...' }));

      const network = DEFAULT_NETWORK;
      await readOnlyWalletService.initialize(xpub, network);

      // Set up event listeners for real-time updates
      setupEventListeners();

      setState(prev => ({ ...prev, loadingStep: 'Loading wallet data...' }));

      let address = '';
      try {
        address = await getDisplayAddressForMode(state.addressMode, readOnlyWalletService);
      } catch {
        throw new Error('Failed to retrieve wallet address. The wallet may not be properly initialized.');
      }

      setState(prev => ({ ...prev, loadingStep: 'Loading balance...' }));

      const balances = await readOnlyWalletService.getBalance(TOKEN_IDS.HTR);

      // Load registered tokens for this network
      const genesisHash = ''; // TODO: Get from RPC handler
      const tokenLoadResult = await loadTokensWithBalances(network, genesisHash, {
        detailedErrors: false,
      });

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
        registeredTokens: tokenLoadResult.tokens,
        error: tokenLoadResult.warning,
      }));
    } catch (error) {
      // Check for unauthorized errors first
      if (error instanceof SnapUnauthorizedError) {
        handleSnapError(error);
        setState(prev => ({
          ...prev,
          isConnecting: false,
          loadingStep: '',
        }));
        return;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if snap crashed
      const snapCrashed =
        errorMessage.includes('DataCloneError') ||
        errorMessage.includes('postMessage') ||
        errorMessage.includes('cloned') ||
        errorMessage.includes('timeout');

      const userMessage = snapCrashed
        ? 'MetaMask Snap is not responding. Please refresh the page and try again.'
        : errorMessage || 'Failed to connect to wallet';

      setState(prev => ({
        ...prev,
        isConnecting: false,
        loadingStep: '',
        error: userMessage,
      }));
    } finally {
      // Safety net: ensure loading state is always cleared
      setState(prev => {
        if (prev.isConnecting || prev.loadingStep) {
          return {
            ...prev,
            isConnecting: false,
            loadingStep: '',
          };
        }
        return prev;
      });
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
        .then(() => { })
        .catch((error) => {
          console.error('Failed to check existing connection:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to check connection';
          setState(prev => ({
            ...prev,
            isCheckingConnection: false,
            loadingStep: '',
            error: errorMessage,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Clear ALL localStorage keys that start with 'hathor'
    // This includes: xpub, network, address mode, registered tokens, etc.
    const keysToRemove = Object.keys(localStorage).filter(key =>
      key.startsWith('hathor')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // stop() will call removeAllListeners() internally
    readOnlyWalletService.stop();
    setState(initialState);
  };

  const refreshTokenBalances = React.useCallback(async () => {
    if (!state.isConnected || !readOnlyWalletService.isReady()) return;

    try {
      // Get current tokens from state using functional update to avoid stale closure
      let tokensSnapshot: TokenInfo[] = [];
      setState(prev => {
        tokensSnapshot = prev.registeredTokens;
        return prev; // No state change yet
      });

      // Fetch balances for all tokens
      const balanceUpdates = await Promise.all(
        tokensSnapshot.map(async (token) => {
          const balance = await fetchTokenBalance(token.uid);
          if (balance) {
            return {
              uid: token.uid,
              balance,
            };
          }
          return null;
        })
      );

      // Update state by merging balance updates into existing tokens
      setState(prev => ({
        ...prev,
        registeredTokens: prev.registeredTokens.map(token => {
          const update = balanceUpdates.find(u => u && u.uid === token.uid);
          if (update) {
            return { ...token, balance: update.balance };
          }
          return token;
        }),
      }));
    } catch (error) {
      log.error('Failed to refresh token balances:', error);
    }
  }, [state.isConnected]);

  const refreshBalance = React.useCallback(async () => {
    if (!state.isConnected || !readOnlyWalletService.isReady()) return;

    try {
      const balances = await readOnlyWalletService.getBalance(TOKEN_IDS.HTR);

      // Also refresh token balances
      await refreshTokenBalances();

      setState(prev => ({ ...prev, balances, error: null }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh balance',
      }));
    }
  }, [state.isConnected, refreshTokenBalances]);

  const refreshAddress = async () => {
    if (!state.isConnected || !readOnlyWalletService.isReady()) return;

    try {
      const address = await getDisplayAddressForMode(state.addressMode, readOnlyWalletService);
      setState(prev => ({ ...prev, address, error: null }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh address. The wallet may not be properly initialized.',
      }));
    }
  };

  const getTransactionHistory = async (count: number = 10, skip: number = 0, tokenId: string = TOKEN_IDS.HTR): Promise<TransactionHistoryItem[]> => {
    if (!state.isConnected || !readOnlyWalletService.isReady()) {
      // Return empty for disconnected state - this is expected
      return [];
    }

    try {
      return await readOnlyWalletService.getTransactionHistory(count, skip, tokenId);
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);

      // Set error in state so UI can show it
      setState(prev => ({
        ...prev,
        error: 'Failed to load transaction history. Please try again.',
      }));

      // Still return empty array, but user knows WHY it's empty
      return [];
    }
  };

  const sendTransaction = async (params: SendTransactionParams) => {
    log.debug('sendTransaction wrapper called');
    log.debug('Transaction params:', params);
    log.debug('Wallet connected:', state.isConnected);
    log.debug('Current network:', state.network);

    try {
      const result = await WalletServiceMethods.sendTransaction(invokeSnap, params);
      log.info('Transaction completed successfully');
      return result;
    } catch (error) {
      log.error('Transaction failed in wrapper:', error);
      handleSnapError(error);
    }
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

      // Set up event listeners for real-time updates
      setupEventListeners();

      setState(prev => ({ ...prev, loadingStep: 'Loading wallet data...' }));

      // Get fresh data from the new network
      let address = '';
      try {
        address = await getDisplayAddressForMode(state.addressMode, readOnlyWalletService);
      } catch (addressError) {
        log.error('Failed to get current address after network change:', addressError);
        throw new Error('Failed to retrieve wallet address on new network. The wallet may not be properly initialized.');
      }

      const balances = await readOnlyWalletService.getBalance(TOKEN_IDS.HTR);

      // Load registered tokens for new network
      const genesisHash = ''; // TODO: Get from RPC handler
      const tokenLoadResult = await loadTokensWithBalances(newNetwork, genesisHash, {
        detailedErrors: false,
      });

      // Update localStorage with new network
      localStorage.setItem(STORAGE_KEYS.NETWORK, newNetwork);

      setState(prev => ({
        ...prev,
        network: newNetwork,
        address,
        balances,
        isCheckingConnection: false,
        loadingStep: '',
        error: tokenLoadResult.warning,
        registeredTokens: tokenLoadResult.tokens,
      }));

    } catch (networkChangeError) {
      // Check for unauthorized errors first
      if (networkChangeError instanceof SnapUnauthorizedError) {
        handleSnapError(networkChangeError);
        setState(prev => ({
          ...prev,
          isCheckingConnection: false,
          loadingStep: '',
        }));
        return;
      }

      const originalError = networkChangeError instanceof Error ? networkChangeError.message : String(networkChangeError);
      log.error('Failed to change network:', networkChangeError);

      // Check if snap crashed (DataCloneError, unresponsive, etc.)
      const snapCrashed =
        originalError.includes('DataCloneError') ||
        originalError.includes('postMessage') ||
        originalError.includes('cloned') ||
        originalError.includes('ERR_NETWORK') ||
        originalError.includes('Network Error');

      if (snapCrashed) {
        log.warn('Snap appears to have crashed, skipping rollback and forcing disconnect');

        // Don't attempt rollback if snap crashed - just disconnect
        localStorage.removeItem(STORAGE_KEYS.XPUB);
        localStorage.removeItem(STORAGE_KEYS.NETWORK);

        try {
          await readOnlyWalletService.stop();
        } catch (stopError) {
          log.error('Failed to stop wallet during crash recovery:', stopError);
        }

        setState({
          ...initialState,
          isCheckingConnection: false,
          isConnecting: false,
          loadingStep: '',
          error: `Network change failed: ${originalError}. MetaMask Snap may need to be reloaded. Please refresh the page and try again.`,
        });
        return;
      }

      // Only attempt rollback if snap is still responding
      try {
        setState(prev => ({ ...prev, loadingStep: 'Rolling back to previous network...' }));

        // Add timeout to rollback attempt
        const rollbackPromise = (async () => {
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
          if (state.xpub) {
            await readOnlyWalletService.initialize(state.xpub, previousNetwork);
          }
        })();

        // Timeout after configured duration
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Rollback timeout')), SNAP_TIMEOUTS.ROLLBACK)
        );

        await Promise.race([rollbackPromise, timeoutPromise]);

        // Restore previous state with original error preserved
        setState(prev => ({
          ...prev,
          network: previousNetwork,
          address: previousAddress,
          balances: previousBalances,
          isCheckingConnection: false,
          loadingStep: '',
          error: `Failed to change network: ${originalError}. Reverted to ${previousNetwork}.`,
        }));
      } catch (rollbackError) {
        log.error('Rollback failed:', rollbackError);
        log.warn('Forcing wallet disconnect due to failed rollback');

        // Clear localStorage and stop wallet
        localStorage.removeItem(STORAGE_KEYS.XPUB);
        localStorage.removeItem(STORAGE_KEYS.NETWORK);

        try {
          await readOnlyWalletService.stop();
        } catch (stopError) {
          log.error('CRITICAL: Failed to cleanup wallet during forced disconnect:', stopError);
        }

        // Verify wallet is fully stopped to prevent memory leaks
        if (readOnlyWalletService.isReady()) {
          log.error('CRITICAL: Wallet still active after stop attempt - possible resource leak');
        }

        // Reset to disconnected state with both errors
        setState({
          ...initialState,
          isCheckingConnection: false,
          isConnecting: false,
          loadingStep: '',
          error: `Network change failed (${originalError}) and rollback also failed. Please reconnect your wallet.`,
        });
      }
    } finally {
      // Safety net: ensure loading states are always cleared
      setState(prev => {
        if (prev.isCheckingConnection || prev.loadingStep) {
          return {
            ...prev,
            isCheckingConnection: false,
            loadingStep: '',
          };
        }
        return prev;
      });
    }
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
    // Also clear MetaMask error when manually setting error to null
    if (error === null) {
      setMetamaskError(null);
    }
  };

  const setHistoryDialogState = (isOpen: boolean, page: number = 0) => {
    setState(prev => ({
      ...prev,
      isHistoryDialogOpen: isOpen,
      currentHistoryPage: page,
      // Clear new transaction when opening dialog or changing pages
      newTransaction: null,
    }));
  };

  const clearNewTransaction = () => {
    setState(prev => ({ ...prev, newTransaction: null }));
  };

  const registerToken = async (configString: string) => {
    if (!state.isConnected || !readOnlyWalletService.isReady()) {
      throw new Error('Wallet not connected');
    }

    try {
      // genesisHash is empty string for now (TODO in RPC handler)
      const genesisHash = '';
      log.debug('Registering token...');
      const tokenInfo = await tokenRegistryService.registerToken(
        configString,
        state.network,
        genesisHash
      );
      log.info('Token registered:', { uid: tokenInfo.uid, isNFT: tokenInfo.isNFT, symbol: tokenInfo.symbol });

      // Fetch balance immediately after registration
      const balance = await fetchTokenBalance(tokenInfo.uid);
      if (balance) {
        tokenInfo.balance = balance;
      }
      log.debug('Balance fetched:', tokenInfo.balance);

      // Update state with new or updated token
      setState(prev => {
        const existingIndex = prev.registeredTokens.findIndex(t => t.uid === tokenInfo.uid);
        if (existingIndex >= 0) {
          // Update existing token
          log.debug('Updating existing token at index', existingIndex);
          const updatedTokens = [...prev.registeredTokens];
          updatedTokens[existingIndex] = tokenInfo;
          return {
            ...prev,
            registeredTokens: updatedTokens,
          };
        } else {
          // Add new token
          log.debug('Adding new token, total will be:', prev.registeredTokens.length + 1);
          return {
            ...prev,
            registeredTokens: [...prev.registeredTokens, tokenInfo],
          };
        }
      });
      log.debug('State updated with token');
    } catch (error) {
      log.error('Failed to register token:', error);
      throw error;
    }
  };

  const unregisterToken = async (tokenUid: string) => {
    if (!state.isConnected) {
      throw new Error('Wallet is not connected');
    }

    // Prevent HTR from being unregistered
    if (tokenUid === TOKEN_IDS.HTR) {
      log.error('Cannot unregister HTR token');
      throw new Error('Cannot unregister the native HTR token');
    }

    try {
      const genesisHash = '';
      tokenRegistryService.unregisterToken(tokenUid, state.network, genesisHash);

      // Update state
      setState(prev => ({
        ...prev,
        registeredTokens: prev.registeredTokens.filter(t => t.uid !== tokenUid),
      }));
    } catch (error) {
      log.error('Failed to unregister token:', error);
      throw error;
    }
  };

  const setSelectedTokenFilter = (filter: TokenFilter) => {
    setState(prev => ({ ...prev, selectedTokenFilter: filter }));
  };

  const getTokenBalance = (tokenUid: string): TokenInfo | undefined => {
    return state.registeredTokens.find(t => t.uid === tokenUid);
  };

  const setAddressMode = async (mode: AddressMode) => {
    const saved = saveAddressMode(mode);
    if (!saved) {
      setState(prev => ({
        ...prev,
        error: 'Failed to save address mode preference. Your selection may not persist after page reload.'
      }));
    }

    setState(prev => ({ ...prev, addressMode: mode }));

    // Refresh the displayed address to reflect the new mode
    if (readOnlyWalletService.isReady()) {
      try {
        const address = await getDisplayAddressForMode(mode, readOnlyWalletService);
        setState(prev => ({ ...prev, address }));
      } catch (error) {
        console.error('Failed to refresh address after mode change:', error);
      }
    }
  };

  const handleNewTransaction = React.useCallback(async (tx: unknown) => {
    if (!state.isConnected || !readOnlyWalletService.isReady()) return;

    // Type cast the transaction
    const transaction = tx as Record<string, unknown>;

    try {
      console.log('Processing new transaction:', transaction.tx_id);

      // Refresh balance to get accurate amounts
      await refreshBalance();

      // Determine transaction type and amount for notification
      // Parse outputs to check if we received HTR
      let receivedAmount = 0n;
      let sentAmount = 0n;

      const currentAddress = readOnlyWalletService.getCurrentAddress()?.address;

      // Check outputs for received amounts
      if (Array.isArray(transaction.outputs) && currentAddress) {
        for (const output of transaction.outputs as Array<Record<string, unknown>>) {
          if ((output.decoded as Record<string, unknown>)?.address === currentAddress && output.token === TOKEN_IDS.HTR) {
            const value = toBigInt(output.value as number | bigint);
            receivedAmount += value;
          }
        }
      }

      // Check inputs for sent amounts
      if (Array.isArray(transaction.inputs) && currentAddress) {
        for (const input of transaction.inputs as Array<Record<string, unknown>>) {
          if ((input.decoded as Record<string, unknown>)?.address === currentAddress && input.token === TOKEN_IDS.HTR) {
            const value = toBigInt(input.value as number | bigint);
            sentAmount += value;
          }
        }
      }

      // Only process if this transaction affects our wallet
      if (receivedAmount === 0n && sentAmount === 0n) {
        return;
      }

      const netAmount = receivedAmount - sentAmount;
      const transactionType = netAmount >= 0n ? 'received' : 'sent';
      const absoluteAmount = netAmount >= 0n ? netAmount : -netAmount;

      // Update state based on current UI state using functional update
      setState(prev => {
        // Check current state for UI decisions
        if (prev.isHistoryDialogOpen && prev.currentHistoryPage === 0) {
          // Page 1 of history: prepend transaction to list
          return {
            ...prev,
            newTransaction: {
              tx_id: transaction.tx_id,
              timestamp: transaction.timestamp,
              balance: netAmount,
              is_voided: transaction.is_voided || transaction.voided || false,
              type: transactionType,
              amount: absoluteAmount,
            },
          };
        } else {
          // Home screen or page 2+: show notification
          return {
            ...prev,
            newTransaction: {
              type: transactionType,
              amount: absoluteAmount,
              timestamp: transaction.timestamp,
            },
          };
        }
      });
    } catch (error) {
      console.error('Failed to process transaction event:', error);
      // Set a subtle warning that user can see
      setState(prev => ({
        ...prev,
        error: 'Failed to process new transaction notification. Please refresh balance to ensure accuracy.'
      }));

      // Auto-clear the warning after 10 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, 10000);
    }
  }, [state.isConnected, refreshBalance]);

  // Use a ref to maintain stable event handler
  const handleNewTransactionRef = React.useRef(handleNewTransaction);
  React.useEffect(() => {
    handleNewTransactionRef.current = handleNewTransaction;
  }, [handleNewTransaction]);

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
    setHistoryDialogState,
    clearNewTransaction,
    registerToken,
    unregisterToken,
    refreshTokenBalances,
    setSelectedTokenFilter,
    getTokenBalance,
    setAddressMode,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
      <ConnectionLostModal
        isOpen={showConnectionLostModal}
        onReconnect={handleReconnect}
      />
    </WalletContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
