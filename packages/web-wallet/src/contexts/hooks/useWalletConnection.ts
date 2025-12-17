import { useState, useEffect, useRef, useCallback } from 'react';
import { readOnlyWalletWrapper } from '../../services/ReadOnlyWalletWrapper';
import { SnapUnauthorizedError } from '../../services/SnapService';
import { CHECK_CONNECTION_TIMEOUT, DEFAULT_NETWORK, TOKEN_IDS } from '@/constants';
import { getAddressForMode, type AddressMode } from '../../utils/addressMode';
import { loadTokensWithBalances } from '../../utils/tokenLoading';
import { SNAP_TIMEOUTS } from '../../constants/timeouts';
import { createLogger } from '../../utils/logger';
// TODO: Re-enable when transaction notifications are fixed
// import { toBigInt } from '../../utils/hathor';
import { raceWithTimeout } from '../../utils/promise';
import type { WalletBalance } from '../../types/wallet';
import type { TokenInfo } from '../../types/token';
import { z } from 'zod';
import { defaultSnapOrigin } from '@hathor/snap-utils';
import { ERROR_PATTERNS, WalletLibErrors, PROVIDER_ERROR_CODES, hasErrorCode } from '../../errors/WalletConnectionErrors';
import { isSnapCrashedError, getSnapErrorUserMessage } from '../../utils/snapErrors';

const log = createLogger('useWalletConnection');

// Zod schemas for snap response validation
const SnapNetworkResponseSchema = z.object({
  response: z.object({
    network: z.string(),
  }).optional(),
}).passthrough();

const XpubResponseSchema = z.object({
  response: z.object({
    xpub: z.string(),
  }),
}).passthrough();

const GetSnapsResponseSchema = z.record(
  z.string(),
  z.object({
    version: z.string(),
    enabled: z.boolean(),
    blocked: z.boolean(),
  })
);

// TODO: Re-enable when transaction notifications are fixed
// const TransactionSchema = z.object({
//   outputs: z.array(
//     z.object({
//       decoded: z.object({
//         address: z.string().optional(),
//       }).passthrough(),
//       token: z.string(),
//       value: z.union([z.number(), z.bigint()]),
//     }).passthrough()
//   ).optional(),
//   inputs: z.array(
//     z.object({
//       decoded: z.object({
//         address: z.string().optional(),
//       }).passthrough(),
//       token: z.string(),
//       value: z.union([z.number(), z.bigint()]),
//     }).passthrough()
//   ).optional(),
// }).passthrough();

const STORAGE_KEYS = {
  XPUB: 'hathor_wallet_xpub',
  NETWORK: 'hathor_wallet_network',
};

interface UseWalletConnectionOptions {
  addressMode: AddressMode;
  request: (params: { method: string; params?: unknown }) => Promise<unknown>;
  invokeSnap: (params: { method: string; params?: Record<string, unknown> }) => Promise<unknown>;
  requestSnap: () => Promise<void>;
  metamaskError: Error | null;
  onRefreshBalance: () => Promise<void>;
  onError: (error: string | null) => void;
  onShowConnectionLostModal: (show: boolean) => void;
  onNewTransaction: (notification: { type: 'sent' | 'received'; amount: bigint; timestamp: number; symbol: string; tokenUid: string }) => void;
}

/**
 * Return type for useWalletConnection hook.
 * Core wallet connection state and operations.
 */
export interface WalletConnectionResult {
  /** Whether wallet is connected and ready */
  isConnected: boolean;
  /** Whether wallet connection is in progress */
  isConnecting: boolean;
  /** Whether checking for existing connection on mount */
  isCheckingConnection: boolean;
  /** Current loading step message for UI feedback */
  loadingStep: string;
  /** Extended public key from snap */
  xpub: string | null;
  /** Current wallet address */
  address: string;
  /** HTR token balances (available and locked) as Map for O(1) lookups */
  balances: Map<string, WalletBalance>;
  /** Current network (mainnet/testnet) */
  network: string;
  /** Installed Snap version */
  snapVersion: string | null;
  /** List of registered custom tokens with metadata */
  registeredTokens: TokenInfo[];
  /** Updates displayed address (internal use by other hooks) */
  setAddress: (address: string) => void;
  /** Updates balance state (internal use by other hooks) */
  setBalances: (balances: Map<string, WalletBalance>) => void;
  /** Updates network state (internal use by other hooks) */
  setNetwork: (network: string) => void;
  /** Updates registered tokens (internal use by other hooks) */
  setRegisteredTokens: (tokens: TokenInfo[]) => void;
  /** Initiates wallet connection via MetaMask Snap */
  connectWallet: () => Promise<void>;
  /** Disconnects wallet and clears all state */
  disconnectWallet: () => Promise<void>;
  /** Handles reconnection after snap authorization lost */
  handleReconnect: () => void;
  /** Handles snap-specific errors (unauthorized, etc.) */
  handleSnapError: (error: unknown) => void;
  /** Refreshes address for given address mode */
  refreshAddressForMode: (mode: AddressMode) => Promise<void>;
  /** Stops wallet service (used during network changes) */
  stopWallet: () => Promise<void>;
  /** Reinitializes wallet with new xpub/network */
  reinitializeWallet: (newXpub: string, newNetwork: string) => Promise<void>;
  /** Sets up wallet event listeners */
  setupEventListeners: () => void;
  /** Updates loading state for network operations */
  setLoadingState: (loading: boolean, step: string) => void;
}

export function useWalletConnection(options: UseWalletConnectionOptions): WalletConnectionResult {
  const {
    addressMode,
    invokeSnap,
    requestSnap,
    metamaskError,
    onRefreshBalance,
    onError,
    onShowConnectionLostModal,
    // TODO: Re-enable when transaction notifications are fixed
    // onNewTransaction,
  } = options;

  // Check localStorage synchronously to determine initial state
  const hasStoredConnection = (() => {
    try {
      return !!localStorage.getItem(STORAGE_KEYS.XPUB);
    } catch {
      return false;
    }
  })();

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(hasStoredConnection);
  const [loadingStep, setLoadingStep] = useState(hasStoredConnection ? 'Checking for existing connection...' : '');
  const [xpub, setXpub] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [balances, setBalances] = useState<Map<string, WalletBalance>>(new Map());
  const [network, setNetwork] = useState('mainnet');
  const [snapVersion, setSnapVersion] = useState<string | null>(null);
  const [registeredTokens, setRegisteredTokens] = useState<TokenInfo[]>([]);

  // Use a ref to prevent concurrent connection checks
  const isCheckingRef = useRef(false);
  const isMountedRef = useRef(false);

  // Ref for stable transaction handler to prevent stale closures
  // Initialized with no-op function, updated after handler is defined
  const handleNewTransactionRef = useRef<(tx: unknown) => Promise<void>>(() => Promise.resolve());

  const setupEventListeners = () => {
    // Remove all existing listeners to prevent duplicates
    readOnlyWalletWrapper.removeAllListeners();

    // Register new listeners using stable ref wrapper
    readOnlyWalletWrapper.on('new-tx', (tx) => handleNewTransactionRef.current(tx));
    readOnlyWalletWrapper.on('update-tx', (tx) => handleNewTransactionRef.current(tx));
  };

  const handleSnapError = (error: unknown) => {
    if (error instanceof SnapUnauthorizedError) {
      log.error('Snap unauthorized error detected - showing connection lost modal');
      onShowConnectionLostModal(true);
      throw error;
    }
    throw error;
  };

  const handleReconnect = () => {
    onShowConnectionLostModal(false);
    disconnectWallet();
    window.location.reload();
  };

  /**
   * Verifies snap installation and permissions.
   * Returns the installed snap version.
   * Throws typed errors for different snap states.
   */
  const verifySnapInstallation = async (): Promise<string> => {
    // wallet_getSnaps is a MetaMask wallet method, not a snap method
    // So we need to call it via window.ethereum directly
    if (!window.ethereum || !window.ethereum.isMetaMask) {
      throw new Error('MetaMask not found');
    }
    const snapsResponse = await window.ethereum.request({
      method: 'wallet_getSnaps',
    });

    // Handle null/undefined response (MetaMask not initialized or no snaps)
    if (!snapsResponse) {
      log.error('wallet_getSnaps returned null - MetaMask may not be initialized');
      throw new Error(ERROR_PATTERNS.SNAP_NOT_INSTALLED);
    }

    // Validate snaps response
    const snapsValidation = GetSnapsResponseSchema.safeParse(snapsResponse);
    if (!snapsValidation.success) {
      log.error('Invalid wallet_getSnaps response:', snapsValidation.error);
      throw new Error(ERROR_PATTERNS.SNAP_NOT_INSTALLED);
    }

    const snaps = snapsValidation.data;
    const ourSnap = snaps[defaultSnapOrigin];

    if (!ourSnap) {
      log.error('Snap not found in installed snaps');
      throw new Error(ERROR_PATTERNS.SNAP_NOT_INSTALLED);
    }

    if (ourSnap.blocked) {
      log.error('Snap is blocked');
      throw new Error(ERROR_PATTERNS.SNAP_BLOCKED);
    }

    if (!ourSnap.enabled) {
      log.error('Snap is not enabled');
      throw new Error(ERROR_PATTERNS.SNAP_DISABLED);
    }

    return ourSnap.version;
  };

  /**
   * Initializes the read-only wallet service with stored credentials.
   * Returns the network used for initialization.
   */
  const initializeWalletFromStorage = async (
    storedXpub: string,
    storedNetwork: string
  ): Promise<string> => {
    if (readOnlyWalletWrapper.isReady()) {
      await readOnlyWalletWrapper.stop();
    }

    await readOnlyWalletWrapper.initialize(storedXpub, storedNetwork);
    setupEventListeners();

    return storedNetwork;
  };

  /**
   * Loads wallet state including address, balances, and registered tokens.
   * Returns all loaded data for state updates.
   */
  const loadWalletState = async (
    network: string,
    addressMode: AddressMode
  ): Promise<{
    address: string;
    balances: Map<string, WalletBalance>;
    tokens: TokenInfo[];
    warning: string | null;
  }> => {
    // Get wallet address
    let walletAddress: string;
    try {
      walletAddress = await getAddressForMode(addressMode, readOnlyWalletWrapper);
    } catch (addressError) {
      const originalMessage = addressError instanceof Error ? addressError.message : String(addressError);
      log.error('Failed to get display address:', originalMessage);
      throw new Error(`Failed to retrieve wallet address: ${originalMessage}`);
    }

    // Get balances
    const walletBalances = await readOnlyWalletWrapper.getBalance(TOKEN_IDS.HTR);

    // Load registered tokens with NFT detection and balance fetching
    const genesisHash = '';
    const tokenLoadResult = await loadTokensWithBalances(network, genesisHash, {
      clearNftCache: true,
      detailedErrors: true,
    });

    return {
      address: walletAddress,
      balances: walletBalances,
      tokens: tokenLoadResult.tokens,
      warning: tokenLoadResult.warning,
    };
  };

  const checkExistingConnection = async (signal?: AbortSignal) => {
    // Check if already aborted before starting
    if (signal?.aborted) {
      return;
    }

    if (isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;
    setIsCheckingConnection(true);
    setLoadingStep('Checking existing connection...');

    // Reset checking flag if aborted
    signal?.addEventListener('abort', () => {
      isCheckingRef.current = false;
    });

    try {
      const storedXpub = localStorage.getItem(STORAGE_KEYS.XPUB);
      const storedNetwork = localStorage.getItem(STORAGE_KEYS.NETWORK) || DEFAULT_NETWORK;

      if (!storedXpub) {
        setIsCheckingConnection(false);
        setLoadingStep('');
        return;
      }

      // Step 1: Request snap connection to ensure it's active
      setLoadingStep('Connecting to snap...');
      try {
        await requestSnap();
      } catch (snapRequestError) {
        log.error('Failed to request snap:', snapRequestError);
        throw new Error(ERROR_PATTERNS.SNAP_CONNECTION_FAILED);
      }

      // Step 2: Verify snap installation and permissions
      setLoadingStep('Verifying snap installation...');
      const installedVersion = await verifySnapInstallation();
      setSnapVersion(installedVersion);

      // Step 3: Initialize wallet service
      setLoadingStep('Initializing read-only wallet...');
      await initializeWalletFromStorage(storedXpub, storedNetwork);

      // Step 4: Load wallet state
      setLoadingStep('Loading wallet data...');
      const walletState = await loadWalletState(storedNetwork, addressMode);

      // Check if we should still update state (component might have unmounted)
      if (!isMountedRef.current) {
        return;
      }

      // Update all state
      setIsConnected(true);
      setIsCheckingConnection(false);
      setAddress(walletState.address);
      setBalances(walletState.balances);
      setNetwork(storedNetwork);
      setXpub(storedXpub);
      setLoadingStep('');
      setRegisteredTokens(walletState.tokens);
      onError(walletState.warning);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Ignore concurrent initialization (React Strict Mode double-mount)
      if (errorMessage.includes(ERROR_PATTERNS.ALREADY_INITIALIZING)) {
        return;
      }

      // Ignore user cancellations
      if (
        hasErrorCode(error, PROVIDER_ERROR_CODES.USER_REJECTED) ||
        errorMessage.toLowerCase().includes('rejected') ||
        errorMessage.toLowerCase().includes('cancelled') ||
        errorMessage.includes(ERROR_PATTERNS.ABORTED)
      ) {
        return;
      }

      log.error('Error in checkExistingConnection:', error);

      // Determine if we should clear storage
      const snapCrashed = isSnapCrashedError(errorMessage);
      const shouldClearStorage =
        error instanceof WalletLibErrors.XPubError ||
        error instanceof WalletLibErrors.UninitializedWalletError ||
        hasErrorCode(error, PROVIDER_ERROR_CODES.UNAUTHORIZED) ||
        snapCrashed ||
        errorMessage.includes(ERROR_PATTERNS.SNAP_NOT_INSTALLED) ||
        errorMessage.includes(ERROR_PATTERNS.SNAP_BLOCKED) ||
        errorMessage.includes(ERROR_PATTERNS.SNAP_DISABLED) ||
        errorMessage.includes(ERROR_PATTERNS.SNAP_CONNECTION_FAILED) ||
        errorMessage.includes(ERROR_PATTERNS.AUTHENTICATION);

      if (shouldClearStorage) {
        localStorage.removeItem(STORAGE_KEYS.XPUB);
        localStorage.removeItem(STORAGE_KEYS.NETWORK);
      }

      // Generate user-friendly message
      let userMessage: string;
      if (error instanceof WalletLibErrors.XPubError) {
        userMessage = 'Invalid wallet key. Please reconnect your wallet.';
      } else if (snapCrashed) {
        userMessage = getSnapErrorUserMessage(errorMessage);
      } else if (errorMessage.includes(ERROR_PATTERNS.SNAP_BLOCKED)) {
        userMessage = 'Snap is blocked. Please enable it in MetaMask settings.';
      } else if (errorMessage.includes(ERROR_PATTERNS.SNAP_DISABLED)) {
        userMessage = 'Snap is disabled. Please enable it in MetaMask settings.';
      } else if (errorMessage.includes(ERROR_PATTERNS.SNAP_NOT_INSTALLED)) {
        userMessage = 'Snap not installed. Please connect your wallet.';
      } else if (errorMessage.includes(ERROR_PATTERNS.SNAP_CONNECTION_FAILED)) {
        userMessage = 'Failed to connect to snap. Please reconnect your wallet.';
      } else {
        userMessage = 'Failed to reconnect. Please try connecting manually.';
      }

      setIsCheckingConnection(false);
      setLoadingStep('');
      onError(userMessage);
    } finally {
      isCheckingRef.current = false;
      // Don't reset checking state here - let the success/error handlers do it
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    setLoadingStep('Requesting snap...');
    onError(null);

    try {
      await requestSnap();

      // Verify snap installation and get version
      setLoadingStep('Verifying snap installation...');
      const installedVersion = await verifySnapInstallation();
      setSnapVersion(installedVersion);

      setLoadingStep('Checking snap network...');

      let currentSnapNetwork;
      try {
        const networkCheckPromise = invokeSnap({
          method: 'htr_getConnectedNetwork',
          params: {}
        });

        const networkTest = await raceWithTimeout(
          networkCheckPromise,
          SNAP_TIMEOUTS.NETWORK_CHECK,
          'Network check timeout'
        );

        // Parse JSON if needed, then validate with Zod schema
        const rawResponse = typeof networkTest === 'string' ? JSON.parse(networkTest) : networkTest;
        const validationResult = SnapNetworkResponseSchema.safeParse(rawResponse);

        if (!validationResult.success) {
          log.error('Network response validation failed:', validationResult.error, rawResponse);
          throw new Error(`Invalid snap response: ${validationResult.error.message}`);
        }

        currentSnapNetwork = validationResult.data.response?.network;
      } catch (testError) {
        log.error('Network check failed:', testError);
        throw new Error('Snap is not responding. Please make sure it is installed correctly.');
      }

      const targetNetwork = DEFAULT_NETWORK;
      if (currentSnapNetwork !== targetNetwork) {
        setLoadingStep(`Changing snap network to ${DEFAULT_NETWORK}...`);

        try {
          const changeNetworkPromise = invokeSnap({
            method: 'htr_changeNetwork',
            params: {
              network: currentSnapNetwork,
              newNetwork: targetNetwork
            }
          });

          await raceWithTimeout(
            changeNetworkPromise,
            SNAP_TIMEOUTS.NETWORK_CHANGE,
            'Network change timeout'
          );
        } catch (networkError) {
          log.error('Failed to change snap network:', networkError);
          throw new Error(`Failed to change snap network to ${DEFAULT_NETWORK}`);
        }
      }

      setLoadingStep('Getting xpub from snap...');

      let xpubResponse;
      try {
        const xpubPromise = invokeSnap({
          method: 'htr_getXpub',
          params: {}
        });

        xpubResponse = await raceWithTimeout(
          xpubPromise,
          SNAP_TIMEOUTS.RPC_CALL,
          'Get xpub timeout'
        );
      } catch (snapError) {
        throw new Error(`Failed to get xpub: ${snapError instanceof Error ? snapError.message : String(snapError)}`);
      }

      // Parse and validate xpub response
      const rawResponse = typeof xpubResponse === 'string' ? JSON.parse(xpubResponse) : xpubResponse;
      const validationResult = XpubResponseSchema.safeParse(rawResponse);

      if (!validationResult.success) {
        log.error('Xpub response validation failed:', validationResult.error, rawResponse);
        throw new Error(`Invalid xpub response: ${validationResult.error.message}`);
      }

      const newXpub = validationResult.data.response.xpub;

      setLoadingStep('Initializing read-only wallet...');

      const newNetwork = DEFAULT_NETWORK;
      await readOnlyWalletWrapper.initialize(newXpub, newNetwork);

      setupEventListeners();

      setLoadingStep('Loading wallet data...');

      let walletAddress = '';
      try {
        walletAddress = await getAddressForMode(addressMode, readOnlyWalletWrapper);
      } catch (addressError) {
        // Preserve the original error for debugging
        const originalMessage = addressError instanceof Error ? addressError.message : String(addressError);
        log.error('Failed to get display address during connect:', originalMessage);
        throw new Error(`Failed to retrieve wallet address: ${originalMessage}`);
      }

      setLoadingStep('Loading balance...');

      const walletBalances = await readOnlyWalletWrapper.getBalance(TOKEN_IDS.HTR);

      const genesisHash = '';
      const tokenLoadResult = await loadTokensWithBalances(newNetwork, genesisHash, {
        detailedErrors: false,
      });

      localStorage.setItem(STORAGE_KEYS.XPUB, newXpub);
      localStorage.setItem(STORAGE_KEYS.NETWORK, newNetwork);

      setIsConnected(true);
      setAddress(walletAddress);
      setBalances(walletBalances);
      setNetwork(newNetwork);
      setXpub(newXpub);
      setIsConnecting(false);
      setLoadingStep('');
      setRegisteredTokens(tokenLoadResult.tokens);
      onError(tokenLoadResult.warning);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check for unauthorized (code 4100)
      if (hasErrorCode(error, PROVIDER_ERROR_CODES.UNAUTHORIZED)) {
        log.error('Snap unauthorized - showing connection lost modal');
        localStorage.removeItem(STORAGE_KEYS.XPUB);
        localStorage.removeItem(STORAGE_KEYS.NETWORK);
        onShowConnectionLostModal(true);
        setIsConnecting(false);
        setLoadingStep('');
        return;
      }

      log.error('Error in connectWallet:', error);

      // Generate user message
      const snapCrashed = isSnapCrashedError(errorMessage);
      const userMessage = snapCrashed
        ? getSnapErrorUserMessage(errorMessage)
        : errorMessage || 'Failed to connect to wallet';

      setIsConnecting(false);
      setLoadingStep('');
      onError(userMessage);
    } finally {
      setIsConnecting(false);
      setLoadingStep('');
    }
  };

  const disconnectWallet = async () => {
    const keysToRemove = Object.keys(localStorage).filter(key =>
      key.startsWith('hathor')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));

    try {
      await readOnlyWalletWrapper.stop();
    } catch (error) {
      log.error('Error stopping wallet during disconnect:', error);
    }

    setIsConnected(false);
    setIsConnected(false);
    setIsConnecting(false);
    setIsCheckingConnection(false);
    setLoadingStep('');
    setAddress('');
    setBalances(new Map());
    setNetwork('mainnet');
    setXpub(null);
    setSnapVersion(null);
    setRegisteredTokens([]);
    onError(null);
  };

  // TODO: Re-enable transaction notifications once isAddressMine is fixed
  // Currently, wallet-lib's isAddressMine (checkAddressMine) returns 403 Forbidden when using
  // read-only wallet tokens. This prevents us from determining which outputs belong to the user,
  // which is needed to calculate the received amount and show the notification.
  // Once the read-only token permissions are fixed, uncomment the notification code below.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleNewTransaction = useCallback(async (_tx: unknown) => {
    if (!isConnected || !readOnlyWalletWrapper.isReady()) {
      return;
    }

    // Just refresh balances when a new transaction arrives
    try {
      await onRefreshBalance();
    } catch (error) {
      log.error('Error refreshing balance on new transaction:', error);
    }

    /*
    // WebSocket message format: { type: "new-tx", data: { inputs, outputs, ... } }
    // Extract the transaction data from the message
    const message = tx as { type?: string; data?: unknown };
    const txData = message.data ?? tx;

    // Validate transaction structure
    const txValidation = TransactionSchema.safeParse(txData);
    if (!txValidation.success) {
      log.error('Invalid transaction structure:', txValidation.error, txData);
      return;
    }

    const transaction = txValidation.data;

    try {
      await onRefreshBalance();

      // Track received amounts per token: tokenUid -> amount
      const receivedAmounts = new Map<string, bigint>();

      if (transaction.outputs) {
        for (const output of transaction.outputs) {
          const outputAddress = output.decoded.address;
          if (!outputAddress) continue;

          const isMyAddress = await readOnlyWalletWrapper.isAddressMine(outputAddress);
          if (isMyAddress) {
            const tokenUid = output.token;
            const value = toBigInt(output.value);
            const current = receivedAmounts.get(tokenUid) || 0n;
            receivedAmounts.set(tokenUid, current + value);
          }
        }
      }

      // Fire notification for each registered token with received amount
      for (const [tokenUid, amount] of receivedAmounts) {
        if (amount === 0n) continue;

        // Only show notifications for registered tokens (HTR is always registered)
        let symbol: string;
        if (tokenUid === TOKEN_IDS.HTR) {
          symbol = 'HTR';
        } else {
          const tokenInfo = registeredTokens.find(t => t.uid === tokenUid);
          if (!tokenInfo) continue; // Skip unregistered tokens
          symbol = tokenInfo.symbol;
        }

        onNewTransaction({
          type: 'received',
          amount,
          timestamp: Date.now(),
          symbol,
          tokenUid,
        });
      }
    } catch (error) {
      log.error('Error processing new transaction:', error);
    }
    */
  }, [isConnected, onRefreshBalance]);

  // Set the ref
  handleNewTransactionRef.current = handleNewTransaction;

  // Check existing connection on mount (only if we have stored credentials)
  useEffect(() => {
    // Only check if we have stored credentials
    if (!hasStoredConnection) {
      return;
    }

    isMountedRef.current = true;

    const abortController = new AbortController();

    // Set timeout to abort if connection check takes too long
    const timeoutId = setTimeout(() => {
      log.warn('Connection check timeout reached after', CHECK_CONNECTION_TIMEOUT, 'ms - aborting');
      abortController.abort();
      setIsCheckingConnection(false);
      setLoadingStep('');
      onError(null);
    }, CHECK_CONNECTION_TIMEOUT);

    checkExistingConnection(abortController.signal)
      .catch((error) => {
        // Ignore aborted errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('aborted')) {
          return;
        }

        log.error('Failed to check existing connection:', error);
        setIsCheckingConnection(false);
        setLoadingStep('');
        onError(error instanceof Error ? error.message : 'Failed to check connection');
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    return () => {
      isMountedRef.current = false;
      abortController.abort();
      clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle metamask errors
  useEffect(() => {
    if (metamaskError) {
      onError(metamaskError.message || 'An RPC error occurred');
    }
  }, [metamaskError, onError]);

  /**
   * Refreshes the displayed address for the given address mode.
   * This encapsulates the wallet ready check and address fetching logic.
   */
  const refreshAddressForMode = async (mode: AddressMode) => {
    if (!readOnlyWalletWrapper.isReady()) {
      return;
    }

    try {
      const newAddress = await getAddressForMode(mode, readOnlyWalletWrapper);
      setAddress(newAddress);
    } catch (error) {
      log.error('Failed to refresh address for mode:', error);
      throw error;
    }
  };

  /**
   * Stops the read-only wallet service if it's ready.
   * Used during network changes or wallet reinitialization.
   */
  const stopWallet = async () => {
    if (readOnlyWalletWrapper.isReady()) {
      await readOnlyWalletWrapper.stop();
    }
  };

  /**
   * Reinitializes the read-only wallet with new parameters.
   * Encapsulates wallet lifecycle management.
   */
  const reinitializeWallet = async (newXpub: string, newNetwork: string) => {
    await readOnlyWalletWrapper.initialize(newXpub, newNetwork);
  };

  /**
   * Updates loading state for network operations.
   * Used by network management to show progress during network changes.
   */
  const setLoadingState = (loading: boolean, step: string) => {
    setIsCheckingConnection(loading);
    setLoadingStep(step);
  };

  return {
    isConnected,
    isConnecting,
    isCheckingConnection,
    loadingStep,
    xpub,
    address,
    balances,
    network,
    snapVersion,
    registeredTokens,
    setAddress,
    setBalances,
    setNetwork,
    setRegisteredTokens,
    connectWallet,
    disconnectWallet,
    handleReconnect,
    handleSnapError,
    refreshAddressForMode,
    stopWallet,
    reinitializeWallet,
    setupEventListeners,
    setLoadingState,
  };
}
