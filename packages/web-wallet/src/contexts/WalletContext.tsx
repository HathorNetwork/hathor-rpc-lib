import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { WalletServiceMethods } from '../services/HathorWalletService';
import { readOnlyWalletService } from '../services/ReadOnlyWalletService';
import { useInvokeSnap, useRequestSnap, useMetaMaskContext } from '@hathor/snap-utils';
import { DEFAULT_NETWORK, TOKEN_IDS } from '@/constants';
import type { TokenInfo, TokenFilter } from '../types/token';
import type { WalletBalance, TransactionHistoryItem } from '../types/wallet';
import { tokenRegistryService } from '../services/TokenRegistryService';
import { tokenStorageService } from '../services/TokenStorageService';
import { nftDetectionService } from '../services/NftDetectionService';
import { loadAddressMode, saveAddressMode, getDisplayAddressForMode, type AddressMode } from '../utils/addressMode';
import { toBigInt } from '../utils/hathor';

const STORAGE_KEYS = {
  XPUB: 'hathor_wallet_xpub',
  NETWORK: 'hathor_wallet_network',
};

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
  addressMode: loadAddressMode(),
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

  // Helper function to set up event listeners
  const setupEventListeners = () => {
    // Remove all existing listeners to prevent duplicates
    readOnlyWalletService.removeAllListeners();

    // Register new listeners using stable ref wrapper
    readOnlyWalletService.on('new-tx', (tx) => handleNewTransactionRef.current(tx));
    readOnlyWalletService.on('update-tx', (tx) => handleNewTransactionRef.current(tx));
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

      setState(prev => ({ ...prev, loadingStep: 'Checking snap network...' }));

      // Add timeout to snap network check
      const networkCheckPromise = invokeSnap({
        method: 'htr_getConnectedNetwork',
        params: {}
      });
      const networkCheckTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network check timeout')), 10000)
      );

      const networkTest = await Promise.race([networkCheckPromise, networkCheckTimeout]);
      const parsedNetworkTest = typeof networkTest === 'string' ? JSON.parse(networkTest) : networkTest;
      const currentSnapNetwork = parsedNetworkTest?.response?.network;
      const targetNetwork = DEFAULT_NETWORK;

      if (currentSnapNetwork !== targetNetwork) {
        setState(prev => ({ ...prev, loadingStep: `Changing snap network to ${DEFAULT_NETWORK}...` }));

        // Add timeout to network change
        const changeNetworkPromise = invokeSnap({
          method: 'htr_changeNetwork',
          params: {
            network: currentSnapNetwork,
            newNetwork: targetNetwork
          }
        });
        const changeNetworkTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Network change timeout')), 10000)
        );

        await Promise.race([changeNetworkPromise, changeNetworkTimeout]);
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
        address = await getDisplayAddressForMode(loadAddressMode(), readOnlyWalletService);
      } catch {
        throw new Error('Failed to retrieve wallet address. The wallet may not be properly initialized.');
      }

      const balances = await readOnlyWalletService.getBalance(TOKEN_IDS.HTR);

      // Load registered tokens for this network
      const genesisHash = ''; // TODO: Get from RPC handler
      const registeredTokens = tokenRegistryService.getRegisteredTokens(storedNetwork, genesisHash);

      // Clear NFT detection cache to ensure fresh detection
      nftDetectionService.clearCache();

      // Detect NFT status for all tokens
      const nftMetadata = await nftDetectionService.detectNftBatch(
        registeredTokens.map(t => t.uid),
        storedNetwork
      );

      // Update storage with detected NFT statuses and metadata
      let storageNeedsUpdate = false;
      registeredTokens.forEach((token) => {
        const metadata = nftMetadata.get(token.uid);
        const isNft = metadata?.nft ?? false;
        if (token.isNFT !== isNft || (!token.metadata && metadata)) {
          token.isNFT = isNft;
          token.metadata = metadata || undefined;
          storageNeedsUpdate = true;
        }
      });
      if (storageNeedsUpdate) {
        tokenStorageService.saveTokens(storedNetwork, genesisHash, registeredTokens);
      }

      // Fetch balances for all registered tokens
      let failedTokenCount = 0;
      const tokensWithBalances = await Promise.all(
        registeredTokens.map(async (token) => {
          try {
            const tokenBalances = await readOnlyWalletService.getBalance(token.uid);

            if (tokenBalances && tokenBalances.length > 0) {
              return {
                ...token,
                balance: {
                  available: tokenBalances[0].available,
                  locked: tokenBalances[0].locked,
                },
              };
            }
            return token;
          } catch (error) {
            console.error(`Failed to fetch balance for token ${token.uid}:`, error);
            failedTokenCount++;
            return token;
          }
        })
      );

      // Set warning if some tokens failed to load
      const tokenLoadWarning = failedTokenCount > 0
        ? `Warning: Failed to load balance for ${failedTokenCount} token${failedTokenCount > 1 ? 's' : ''}. Showing cached values.`
        : null;

      setState(prev => ({
        ...prev,
        isConnected: true,
        isCheckingConnection: false,
        address,
        balances,
        network: storedNetwork,
        xpub: storedXpub,
        loadingStep: '',
        registeredTokens: tokensWithBalances,
        error: tokenLoadWarning,
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
          setTimeout(() => reject(new Error('Network check timeout')), 10000)
        );
        const networkTest = await Promise.race([networkCheckPromise, networkCheckTimeout]);

        const parsedNetworkTest = typeof networkTest === 'string' ? JSON.parse(networkTest) : networkTest;
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
            setTimeout(() => reject(new Error('Network change timeout')), 10000)
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
          setTimeout(() => reject(new Error('Get xpub timeout')), 10000)
        );
        xpubResponse = await Promise.race([xpubPromise, xpubTimeout]);
      } catch (snapError) {
        throw new Error(`Failed to get xpub: ${snapError instanceof Error ? snapError.message : String(snapError)}`);
      }

      let parsedResponse = xpubResponse;
      if (typeof xpubResponse === 'string') {
        try {
          parsedResponse = JSON.parse(xpubResponse);
        } catch {
          throw new Error('Invalid JSON response from snap');
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
      const registeredTokens = tokenRegistryService.getRegisteredTokens(network, genesisHash);

      // Detect NFT status for all tokens
      const nftMetadata = await nftDetectionService.detectNftBatch(
        registeredTokens.map(t => t.uid),
        network
      );

      // Update storage with detected NFT statuses and metadata
      let storageNeedsUpdate = false;
      registeredTokens.forEach((token) => {
        const metadata = nftMetadata.get(token.uid);
        const isNft = metadata?.nft ?? false;
        if (token.isNFT !== isNft || (!token.metadata && metadata)) {
          token.isNFT = isNft;
          token.metadata = metadata || undefined;
          storageNeedsUpdate = true;
        }
      });
      if (storageNeedsUpdate) {
        tokenStorageService.saveTokens(network, genesisHash, registeredTokens);
      }

      // Fetch balances for all registered tokens
      let failedTokenCount = 0;
      const tokensWithBalances = await Promise.all(
        registeredTokens.map(async (token) => {
          try {
            const tokenBalances = await readOnlyWalletService.getBalance(token.uid);

            if (tokenBalances && tokenBalances.length > 0) {
              return {
                ...token,
                balance: {
                  available: tokenBalances[0].available,
                  locked: tokenBalances[0].locked,
                },
              };
            }
            return token;
          } catch (error) {
            console.error(`Failed to fetch balance for token ${token.uid}:`, error);
            failedTokenCount++;
            return token;
          }
        })
      );

      localStorage.setItem(STORAGE_KEYS.XPUB, xpub);
      localStorage.setItem(STORAGE_KEYS.NETWORK, network);

      // Set warning if some tokens failed to load
      const tokenLoadWarning = failedTokenCount > 0
        ? `Warning: Failed to load balance for ${failedTokenCount} token${failedTokenCount > 1 ? 's' : ''}. Showing cached values.`
        : null;

      setState(prev => ({
        ...prev,
        isConnected: true,
        address,
        balances,
        network,
        xpub,
        isConnecting: false,
        loadingStep: '',
        registeredTokens: tokensWithBalances,
        error: tokenLoadWarning,
      }));
    } catch (error) {
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
    localStorage.removeItem(STORAGE_KEYS.XPUB);
    localStorage.removeItem(STORAGE_KEYS.NETWORK);
    // stop() will call removeAllListeners() internally
    readOnlyWalletService.stop();
    setState(initialState);
  };

  const refreshBalance = async () => {
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
  };

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
      return [];
    }

    try {
      return await readOnlyWalletService.getTransactionHistory(count, skip, tokenId);
    } catch {
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

      // Set up event listeners for real-time updates
      setupEventListeners();

      setState(prev => ({ ...prev, loadingStep: 'Loading wallet data...' }));

      // Get fresh data from the new network
      let address = '';
      try {
        address = await getDisplayAddressForMode(state.addressMode, readOnlyWalletService);
      } catch (addressError) {
        console.error('Failed to get current address after network change:', addressError);
        throw new Error('Failed to retrieve wallet address on new network. The wallet may not be properly initialized.');
      }

      const balances = await readOnlyWalletService.getBalance(TOKEN_IDS.HTR);

      // Load registered tokens for new network
      const genesisHash = ''; // TODO: Get from RPC handler
      const registeredTokens = tokenRegistryService.getRegisteredTokens(newNetwork, genesisHash);

      // Detect NFT status for all tokens
      const nftMetadata = await nftDetectionService.detectNftBatch(
        registeredTokens.map(t => t.uid),
        newNetwork
      );

      // Update storage with detected NFT statuses and metadata
      let storageNeedsUpdate = false;
      registeredTokens.forEach((token) => {
        const metadata = nftMetadata.get(token.uid);
        const isNft = metadata?.nft ?? false;
        if (token.isNFT !== isNft || (!token.metadata && metadata)) {
          token.isNFT = isNft;
          token.metadata = metadata || undefined;
          storageNeedsUpdate = true;
        }
      });
      if (storageNeedsUpdate) {
        tokenStorageService.saveTokens(newNetwork, genesisHash, registeredTokens);
      }

      // Fetch balances for all registered tokens
      let failedTokenCount = 0;
      const tokensWithBalances = await Promise.all(
        registeredTokens.map(async (token) => {
          try {
            const tokenBalances = await readOnlyWalletService.getBalance(token.uid);

            if (tokenBalances && tokenBalances.length > 0) {
              return {
                ...token,
                balance: {
                  available: tokenBalances[0].available,
                  locked: tokenBalances[0].locked,
                },
              };
            }
            return token;
          } catch (error) {
            console.error(`Failed to fetch balance for token ${token.uid}:`, error);
            failedTokenCount++;
            return token;
          }
        })
      );

      // Update localStorage with new network
      localStorage.setItem(STORAGE_KEYS.NETWORK, newNetwork);

      // Set warning if some tokens failed to load
      const tokenLoadWarning = failedTokenCount > 0
        ? `Warning: Failed to load balance for ${failedTokenCount} token${failedTokenCount > 1 ? 's' : ''}. Showing cached values.`
        : null;

      setState(prev => ({
        ...prev,
        network: newNetwork,
        address,
        balances,
        isCheckingConnection: false,
        loadingStep: '',
        error: tokenLoadWarning,
        registeredTokens: tokensWithBalances,
      }));

    } catch (error) {
      console.error('Failed to change network:', error);

      // Check if snap crashed (DataCloneError, unresponsive, etc.)
      const errorMessage = error instanceof Error ? error.message : String(error);
      const snapCrashed =
        errorMessage.includes('DataCloneError') ||
        errorMessage.includes('postMessage') ||
        errorMessage.includes('cloned') ||
        errorMessage.includes('ERR_NETWORK') ||
        errorMessage.includes('Network Error');

      if (snapCrashed) {
        console.warn('Snap appears to have crashed, skipping rollback and forcing disconnect');

        // Don't attempt rollback if snap crashed - just disconnect
        localStorage.removeItem(STORAGE_KEYS.XPUB);
        localStorage.removeItem(STORAGE_KEYS.NETWORK);

        try {
          await readOnlyWalletService.stop();
        } catch (stopError) {
          console.error('Failed to stop wallet during crash recovery:', stopError);
        }

        setState({
          ...initialState,
          isCheckingConnection: false,
          isConnecting: false,
          loadingStep: '',
          error: 'Network change failed (MetaMask Snap may need to be reloaded). Please refresh the page and try again.',
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

        // Timeout after 10 seconds
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Rollback timeout')), 10000)
        );

        await Promise.race([rollbackPromise, timeoutPromise]);

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

        // Reset to disconnected state - ALWAYS clear loading state
        setState({
          ...initialState,
          isCheckingConnection: false,
          isConnecting: false,
          loadingStep: '',
          error: 'Network change failed. Wallet has been disconnected. Please reconnect.',
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
      console.log('[WalletContext] Registering token...');
      const tokenInfo = await tokenRegistryService.registerToken(
        configString,
        state.network,
        genesisHash
      );
      console.log('[WalletContext] Token registered:', { uid: tokenInfo.uid, isNFT: tokenInfo.isNFT, symbol: tokenInfo.symbol });

      // Fetch balance immediately after registration
      const balances = await readOnlyWalletService.getBalance(tokenInfo.uid);
      if (balances && balances.length > 0) {
        tokenInfo.balance = {
          available: balances[0].available,
          locked: balances[0].locked,
        };
      }
      console.log('[WalletContext] Balance fetched:', tokenInfo.balance);

      // Update state with new or updated token
      setState(prev => {
        const existingIndex = prev.registeredTokens.findIndex(t => t.uid === tokenInfo.uid);
        if (existingIndex >= 0) {
          // Update existing token
          console.log('[WalletContext] Updating existing token at index', existingIndex);
          const updatedTokens = [...prev.registeredTokens];
          updatedTokens[existingIndex] = tokenInfo;
          return {
            ...prev,
            registeredTokens: updatedTokens,
          };
        } else {
          // Add new token
          console.log('[WalletContext] Adding new token, total will be:', prev.registeredTokens.length + 1);
          return {
            ...prev,
            registeredTokens: [...prev.registeredTokens, tokenInfo],
          };
        }
      });
      console.log('[WalletContext] State updated with token');
    } catch (error) {
      console.error('Failed to register token:', error);
      throw error;
    }
  };

  const unregisterToken = async (tokenUid: string) => {
    if (!state.isConnected) {
      throw new Error('Wallet is not connected');
    }

    // Prevent HTR from being unregistered
    if (tokenUid === TOKEN_IDS.HTR) {
      console.error('Cannot unregister HTR token');
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
      console.error('Failed to unregister token:', error);
      throw error;
    }
  };

  const refreshTokenBalances = async () => {
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
          try {
            const balances = await readOnlyWalletService.getBalance(token.uid);
            if (balances && balances.length > 0) {
              return {
                uid: token.uid,
                balance: {
                  available: balances[0].available,
                  locked: balances[0].locked,
                },
              };
            }
            return null;
          } catch (error) {
            console.error(`Failed to fetch balance for token ${token.uid}:`, error);
            return null;
          }
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
      console.error('Failed to refresh token balances:', error);
    }
  };

  const setSelectedTokenFilter = (filter: TokenFilter) => {
    setState(prev => ({ ...prev, selectedTokenFilter: filter }));
  };

  const getTokenBalance = (tokenUid: string): TokenInfo | undefined => {
    return state.registeredTokens.find(t => t.uid === tokenUid);
  };

  const setAddressMode = async (mode: AddressMode) => {
    saveAddressMode(mode);
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

  const handleNewTransaction = async (tx: unknown) => {
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
      // Don't show error to user - they can manually refresh
    }
  };

  // Use a ref to maintain stable event handler
  const handleNewTransactionRef = React.useRef(handleNewTransaction);
  React.useEffect(() => {
    handleNewTransactionRef.current = handleNewTransaction;
  });

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
