import { readOnlyWalletWrapper } from '../../services/ReadOnlyWalletWrapper';
import { SnapUnauthorizedError } from '../../services/SnapService';
import { getAddressForMode, type AddressMode } from '../../utils/addressMode';
import { loadTokensWithBalances } from '../../utils/tokenLoading';
import { TOKEN_IDS } from '@/constants';
import { SNAP_TIMEOUTS } from '../../constants/timeouts';
import { createLogger } from '../../utils/logger';
import { raceWithTimeout } from '../../utils/promise';
import { isSnapCrashedError } from '../../utils/snapErrors';
import type { WalletBalance } from '../../types/wallet';
import type { TokenInfo } from '../../types/token';

const log = createLogger('useNetworkManagement');

const STORAGE_KEYS = {
  XPUB: 'hathor_wallet_xpub',
  NETWORK: 'hathor_wallet_network',
};

interface UseNetworkManagementOptions {
  isConnected: boolean;
  xpub: string | null;
  network: string;
  address: string;
  balances: Map<string, WalletBalance>;
  addressMode: AddressMode;
  invokeSnap: (params: { method: string; params?: Record<string, unknown> }) => Promise<unknown>;
  onSetupEventListeners: () => void;
  onSnapError: (error: unknown) => void;
  onNetworkChange: (params: {
    network: string;
    address: string;
    balances: Map<string, WalletBalance>;
    tokens: TokenInfo[];
    warning: string | null;
  }) => void;
  onLoadingChange: (loading: boolean, step: string) => void;
  onError: (error: string | null) => void;
  onForceDisconnect: () => void;
  // Wallet lifecycle methods from connection hook
  stopWallet: () => Promise<void>;
  reinitializeWallet: (xpub: string, network: string) => Promise<void>;
}

export function useNetworkManagement(options: UseNetworkManagementOptions) {
  const {
    isConnected,
    xpub,
    network,
    address,
    balances,
    addressMode,
    invokeSnap,
    onSetupEventListeners,
    onSnapError,
    onNetworkChange,
    onLoadingChange,
    onError,
    onForceDisconnect,
    stopWallet,
    reinitializeWallet,
  } = options;

  const changeNetwork = async (newNetwork: string) => {
    if (!isConnected || !xpub) {
      return;
    }

    const previousNetwork = network;
    const previousAddress = address;
    const previousBalances = balances;

    try {
      onLoadingChange(true, 'Changing network...');
      onError(null);

      await invokeSnap({
        method: 'htr_changeNetwork',
        params: {
          network: previousNetwork,
          newNetwork: newNetwork,
        }
      });

      onLoadingChange(true, 'Stopping previous wallet...');

      // Stop the old read-only wallet (encapsulated with isReady check)
      await stopWallet();

      onLoadingChange(true, 'Initializing wallet on new network...');

      // Reinitialize read-only wallet with new network
      await reinitializeWallet(xpub, newNetwork);

      // Set up event listeners for real-time updates
      onSetupEventListeners();

      onLoadingChange(true, 'Loading wallet data...');

      // Get fresh data from the new network
      let newAddress = '';
      try {
        newAddress = await getAddressForMode(addressMode, readOnlyWalletWrapper);
      } catch (addressError) {
        log.error('Failed to get current address after network change:', addressError);
        throw new Error('Failed to retrieve wallet address on new network. The wallet may not be properly initialized.');
      }

      const newBalances = await readOnlyWalletWrapper.getBalance(TOKEN_IDS.HTR);

      // Load registered tokens for new network
      const genesisHash = '';
      const tokenLoadResult = await loadTokensWithBalances(newNetwork, genesisHash, {
        clearNftCache: true,
        detailedErrors: false,
      });

      // Update app state first (can throw)
      onNetworkChange({
        network: newNetwork,
        address: newAddress,
        balances: newBalances,
        tokens: tokenLoadResult.tokens,
        warning: tokenLoadResult.warning,
      });

      // Only persist to localStorage after state update succeeds
      localStorage.setItem(STORAGE_KEYS.NETWORK, newNetwork);

      onLoadingChange(false, '');

    } catch (networkChangeError) {
      // Check for unauthorized errors first
      if (networkChangeError instanceof SnapUnauthorizedError) {
        onSnapError(networkChangeError);
        onLoadingChange(false, '');
        return;
      }

      const originalError = networkChangeError instanceof Error ? networkChangeError.message : String(networkChangeError);
      log.error('Failed to change network:', networkChangeError);

      // Check if snap crashed (DataCloneError, unresponsive, etc.)
      const snapCrashed = isSnapCrashedError(originalError) ||
        originalError.includes('ERR_NETWORK') ||
        originalError.includes('Network Error');

      if (snapCrashed) {
        log.warn('Snap appears to have crashed, skipping rollback and forcing disconnect');

        // Don't attempt rollback if snap crashed - just disconnect
        localStorage.removeItem(STORAGE_KEYS.XPUB);
        localStorage.removeItem(STORAGE_KEYS.NETWORK);

        try {
          await stopWallet();
        } catch (stopError) {
          log.error('Failed to stop wallet during crash recovery:', stopError);
        }

        onForceDisconnect();
        onLoadingChange(false, '');
        onError(`Network change failed: ${originalError}. MetaMask Snap may need to be reloaded. Please refresh the page and try again.`);
        return;
      }

      // Only attempt rollback if snap is still responding
      try {
        onLoadingChange(true, 'Rolling back to previous network...');

        // Rollback with timeout to prevent hanging
        const rollbackPromise = (async () => {
          // Change snap back to previous network
          await invokeSnap({
            method: 'htr_changeNetwork',
            params: {
              network: newNetwork,
              newNetwork: previousNetwork,
            }
          });

          // Stop wallet if it was initialized (encapsulated with isReady check)
          await stopWallet();

          // Reinitialize with previous network
          if (xpub) {
            await reinitializeWallet(xpub, previousNetwork);
          }
        })();

        await raceWithTimeout(rollbackPromise, SNAP_TIMEOUTS.ROLLBACK, 'Rollback timeout');

        // Restore previous state with original error preserved
        onNetworkChange({
          network: previousNetwork,
          address: previousAddress,
          balances: previousBalances,
          tokens: [], // Will be restored by caller
          warning: null,
        });
        onLoadingChange(false, '');
        onError(`Failed to change network: ${originalError}. Reverted to ${previousNetwork}.`);
      } catch (rollbackError) {
        log.error('Rollback failed:', rollbackError);
        log.warn('Forcing wallet disconnect due to failed rollback');

        // Clear localStorage and stop wallet
        localStorage.removeItem(STORAGE_KEYS.XPUB);
        localStorage.removeItem(STORAGE_KEYS.NETWORK);

        try {
          await stopWallet();
        } catch (stopError) {
          log.error('CRITICAL: Failed to cleanup wallet during forced disconnect:', stopError);
        }

        // Verify wallet is fully stopped to prevent memory leaks
        // Note: This direct check is intentional for diagnostics after stop attempt
        if (readOnlyWalletWrapper.isReady()) {
          log.error('CRITICAL: Wallet still active after stop attempt - possible resource leak');
        }

        // Reset to disconnected state with both errors
        onForceDisconnect();
        onLoadingChange(false, '');
        onError(`Network change failed (${originalError}) and rollback also failed. Please reconnect your wallet.`);
      }
    } finally {
      // Safety net: ensure loading states are always cleared
      onLoadingChange(false, '');
    }
  };

  return {
    changeNetwork,
  };
}
