import { useState, useEffect, useRef, useCallback } from 'react';
import { readOnlyWalletService } from '../../services/ReadOnlyWalletService';
import { SnapUnauthorizedError } from '../../services/HathorWalletService';
import { DEFAULT_NETWORK, TOKEN_IDS } from '@/constants';
import { getDisplayAddressForMode, type AddressMode } from '../../utils/addressMode';
import { loadTokensWithBalances } from '../../utils/tokenLoading';
import { SNAP_TIMEOUTS } from '../../constants/timeouts';
import { createLogger } from '../../utils/logger';
import { toBigInt } from '../../utils/hathor';
import type { WalletBalance } from '../../types/wallet';
import type { TokenInfo } from '../../types/token';
import { z } from 'zod';

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

const TransactionSchema = z.object({
  outputs: z.array(
    z.object({
      decoded: z.object({
        address: z.string().optional(),
      }).passthrough(),
      token: z.string(),
      value: z.union([z.number(), z.bigint()]),
    }).passthrough()
  ).optional(),
  inputs: z.array(
    z.object({
      decoded: z.object({
        address: z.string().optional(),
      }).passthrough(),
      token: z.string(),
      value: z.union([z.number(), z.bigint()]),
    }).passthrough()
  ).optional(),
}).passthrough();

const STORAGE_KEYS = {
  XPUB: 'hathor_wallet_xpub',
  NETWORK: 'hathor_wallet_network',
};

interface UseWalletConnectionOptions {
  addressMode: AddressMode;
  invokeSnap: (params: { method: string; params?: Record<string, unknown> }) => Promise<unknown>;
  requestSnap: () => Promise<void>;
  metamaskError: Error | null;
  onRefreshBalance: () => Promise<void>;
  onError: (error: string | null) => void;
  onShowConnectionLostModal: (show: boolean) => void;
  onNewTransaction: (notification: { type: 'sent' | 'received'; amount: bigint; timestamp: number }) => void;
}

export function useWalletConnection(options: UseWalletConnectionOptions) {
  const {
    addressMode,
    invokeSnap,
    requestSnap,
    metamaskError,
    onRefreshBalance,
    onError,
    onShowConnectionLostModal,
    onNewTransaction,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [xpub, setXpub] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [network, setNetwork] = useState('mainnet');
  const [registeredTokens, setRegisteredTokens] = useState<TokenInfo[]>([]);

  const isCheckingRef = useRef(false);
  const handleNewTransactionRef = useRef<(tx: unknown) => Promise<void>>(async () => {});

  const setupEventListeners = () => {
    // Remove all existing listeners to prevent duplicates
    readOnlyWalletService.removeAllListeners();

    // Register new listeners using stable ref wrapper
    readOnlyWalletService.on('new-tx', (tx) => handleNewTransactionRef.current(tx));
    readOnlyWalletService.on('update-tx', (tx) => handleNewTransactionRef.current(tx));
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

  const checkExistingConnection = async () => {
    if (isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;
    setIsCheckingConnection(true);
    setLoadingStep('Checking existing connection...');

    try {
      const storedXpub = localStorage.getItem(STORAGE_KEYS.XPUB);
      const storedNetwork = localStorage.getItem(STORAGE_KEYS.NETWORK) || DEFAULT_NETWORK;

      if (!storedXpub) {
        setIsCheckingConnection(false);
        setLoadingStep('');
        return;
      }

      // Verify snap is properly installed and enabled
      log.debug('Starting snap verification...');
      setLoadingStep('Verifying snap installation...');

      try {
        log.debug('Checking installed snaps via wallet_getSnaps...');

        const snapsResponse = await (window as { ethereum?: { request: (args: { method: string }) => Promise<unknown> } }).ethereum?.request({
          method: 'wallet_getSnaps',
        });

        // Validate snaps response
        const snapsValidation = GetSnapsResponseSchema.safeParse(snapsResponse);
        if (!snapsValidation.success) {
          log.error('Invalid wallet_getSnaps response:', snapsValidation.error, snapsResponse);
          throw new Error('Failed to parse installed snaps');
        }

        const snaps = snapsValidation.data;
        log.debug('Installed snaps:', snaps);

        const snapId = 'local:http://localhost:8080';
        const ourSnap = snaps[snapId];

        if (!ourSnap) {
          log.error('Snap not found in installed snaps');
          throw new Error('Snap not installed');
        }

        log.debug('Snap found:', ourSnap);

        if (ourSnap.blocked) {
          log.error('Snap is blocked');
          throw new Error('Snap is blocked');
        }

        if (!ourSnap.enabled) {
          log.error('Snap is not enabled');
          throw new Error('Snap is disabled');
        }

        log.info('Snap is installed and enabled - version:', ourSnap.version);
      } catch (snapError) {
        const errorMsg = snapError instanceof Error ? snapError.message : 'Unknown error';
        const errorCode = (snapError as { code?: number })?.code;

        log.error('Snap verification failed:', errorMsg);

        localStorage.removeItem(STORAGE_KEYS.XPUB);
        localStorage.removeItem(STORAGE_KEYS.NETWORK);

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

        setIsCheckingConnection(false);
        setLoadingStep('');
        onError(userError);
        return;
      }

      setLoadingStep('Initializing read-only wallet...');

      if (readOnlyWalletService.isReady()) {
        await readOnlyWalletService.stop();
      }
      await readOnlyWalletService.initialize(storedXpub, storedNetwork);

      setupEventListeners();

      setLoadingStep('Loading wallet data...');

      let walletAddress = '';
      try {
        walletAddress = await getDisplayAddressForMode(addressMode, readOnlyWalletService);
      } catch {
        throw new Error('Failed to retrieve wallet address. The wallet may not be properly initialized.');
      }

      const walletBalances = await readOnlyWalletService.getBalance(TOKEN_IDS.HTR);

      const genesisHash = '';
      const tokenLoadResult = await loadTokensWithBalances(storedNetwork, genesisHash, {
        clearNftCache: true,
        detailedErrors: true,
      });

      setIsConnected(true);
      setIsCheckingConnection(false);
      setAddress(walletAddress);
      setBalances(walletBalances);
      setNetwork(storedNetwork);
      setXpub(storedXpub);
      setLoadingStep('');
      setRegisteredTokens(tokenLoadResult.tokens);
      onError(tokenLoadResult.warning);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

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

      onError(userMessage);
    } finally {
      isCheckingRef.current = false;
      setIsCheckingConnection(false);
      setLoadingStep('');
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    setLoadingStep('Requesting snap...');
    onError(null);

    try {
      await requestSnap();
      setLoadingStep('Checking snap network...');

      let currentSnapNetwork;
      try {
        const networkCheckPromise = invokeSnap({
          method: 'htr_getConnectedNetwork',
          params: {}
        });

        // Create timeout with cancellable reference
        let timeoutId: NodeJS.Timeout;
        const networkCheckTimeout = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Network check timeout')), SNAP_TIMEOUTS.NETWORK_CHECK);
        });

        const networkTest = await Promise.race([networkCheckPromise, networkCheckTimeout]);

        // Clear timeout to prevent background rejection
        clearTimeout(timeoutId!);

        // Parse JSON if needed, then validate with Zod schema
        const rawResponse = typeof networkTest === 'string' ? JSON.parse(networkTest) : networkTest;
        const validationResult = SnapNetworkResponseSchema.safeParse(rawResponse);

        if (!validationResult.success) {
          log.error('Network response validation failed:', validationResult.error, rawResponse);
          throw new Error(`Invalid snap response: ${validationResult.error.message}`);
        }

        currentSnapNetwork = validationResult.data.response?.network;
      } catch (testError) {
        console.error(testError);
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
          const changeNetworkTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network change timeout')), SNAP_TIMEOUTS.NETWORK_CHANGE)
          );
          await Promise.race([changeNetworkPromise, changeNetworkTimeout]);
        } catch (networkError) {
          console.error(networkError);
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
        const xpubTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Get xpub timeout')), SNAP_TIMEOUTS.RPC_CALL)
        );
        xpubResponse = await Promise.race([xpubPromise, xpubTimeout]);
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
      await readOnlyWalletService.initialize(newXpub, newNetwork);

      setupEventListeners();

      setLoadingStep('Loading wallet data...');

      let walletAddress = '';
      try {
        walletAddress = await getDisplayAddressForMode(addressMode, readOnlyWalletService);
      } catch {
        throw new Error('Failed to retrieve wallet address. The wallet may not be properly initialized.');
      }

      setLoadingStep('Loading balance...');

      const walletBalances = await readOnlyWalletService.getBalance(TOKEN_IDS.HTR);

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
      if (error instanceof SnapUnauthorizedError) {
        handleSnapError(error);
        setIsConnecting(false);
        setLoadingStep('');
        return;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);

      const snapCrashed =
        errorMessage.includes('DataCloneError') ||
        errorMessage.includes('postMessage') ||
        errorMessage.includes('cloned') ||
        errorMessage.includes('timeout');

      const userMessage = snapCrashed
        ? 'MetaMask Snap is not responding. Please refresh the page and try again.'
        : errorMessage || 'Failed to connect to wallet';

      setIsConnecting(false);
      setLoadingStep('');
      onError(userMessage);
    } finally {
      setIsConnecting(false);
      setLoadingStep('');
    }
  };

  const disconnectWallet = () => {
    const keysToRemove = Object.keys(localStorage).filter(key =>
      key.startsWith('hathor')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));

    readOnlyWalletService.stop();

    setIsConnected(false);
    setIsConnecting(false);
    setIsCheckingConnection(false);
    setLoadingStep('');
    setAddress('');
    setBalances([]);
    setNetwork('mainnet');
    setXpub(null);
    setRegisteredTokens([]);
    onError(null);
  };

  const handleNewTransaction = useCallback(async (tx: unknown) => {
    if (!isConnected || !readOnlyWalletService.isReady()) return;

    // Validate transaction structure
    const txValidation = TransactionSchema.safeParse(tx);
    if (!txValidation.success) {
      log.error('Invalid transaction structure:', txValidation.error, tx);
      return;
    }

    const transaction = txValidation.data;

    try {
      await onRefreshBalance();

      let receivedAmount = 0n;
      let sentAmount = 0n;

      if (transaction.outputs) {
        for (const output of transaction.outputs) {
          const outputAddress = output.decoded.address;
          if (!outputAddress) continue;

          const isMyAddress = await readOnlyWalletService.isAddressMine(outputAddress);

          if (isMyAddress && output.token === TOKEN_IDS.HTR) {
            const value = toBigInt(output.value);
            receivedAmount += value;
          }
        }
      }

      if (transaction.inputs) {
        for (const input of transaction.inputs) {
          const inputAddress = input.decoded.address;
          if (!inputAddress) continue;

          const isMyAddress = await readOnlyWalletService.isAddressMine(inputAddress);

          if (isMyAddress && input.token === TOKEN_IDS.HTR) {
            const value = toBigInt(input.value);
            sentAmount += value;
          }
        }
      }

      if (receivedAmount === 0n && sentAmount === 0n) {
        return;
      }

      // Trigger notification
      const netAmount = receivedAmount > sentAmount ? receivedAmount - sentAmount : sentAmount - receivedAmount;
      const notificationType = receivedAmount > sentAmount ? 'received' : 'sent';
      onNewTransaction({
        type: notificationType,
        amount: netAmount,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error processing new transaction:', error);
    }
  }, [isConnected, onRefreshBalance, onNewTransaction]);

  // Set the ref
  handleNewTransactionRef.current = handleNewTransaction;

  // Check existing connection on mount
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const timer = setTimeout(() => {
      timeoutId = setTimeout(() => {
        setIsCheckingConnection(false);
        setLoadingStep('');
        onError(null);
      }, 10000);

      checkExistingConnection()
        .then(() => {})
        .catch((error) => {
          console.error('Failed to check existing connection:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to check connection';
          setIsCheckingConnection(false);
          setLoadingStep('');
          onError(errorMessage);
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
    if (!readOnlyWalletService.isReady()) {
      return;
    }

    try {
      const newAddress = await getDisplayAddressForMode(mode, readOnlyWalletService);
      setAddress(newAddress);
    } catch (error) {
      console.error('Failed to refresh address for mode:', error);
      throw error;
    }
  };

  /**
   * Stops the read-only wallet service if it's ready.
   * Used during network changes or wallet reinitialization.
   */
  const stopWallet = async () => {
    if (readOnlyWalletService.isReady()) {
      await readOnlyWalletService.stop();
    }
  };

  /**
   * Reinitializes the read-only wallet with new parameters.
   * Encapsulates wallet lifecycle management.
   */
  const reinitializeWallet = async (newXpub: string, newNetwork: string) => {
    await readOnlyWalletService.initialize(newXpub, newNetwork);
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
