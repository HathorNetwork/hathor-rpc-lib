import { useState, useEffect, useCallback, useRef } from 'react';
import { tokenDiscoveryService } from '../services/TokenDiscoveryService';
import { createLogger } from '../utils/logger';

const log = createLogger('useTokenDiscovery');

const DISMISS_KEY_PREFIX = 'hathor_wallet_token_discovery_dismissed_';

interface UseTokenDiscoveryOptions {
  isConnected: boolean;
  network: string;
}

interface UseTokenDiscoveryResult {
  /** UIDs of unregistered tokens found on the wallet */
  discoveredTokenUids: string[];
  isDiscovering: boolean;
  isDismissed: boolean;
  dismissBanner: () => void;
  refreshDiscovery: () => Promise<void>;
}

/**
 * Hook for discovering unregistered token UIDs on the wallet.
 * Only fetches the list of token UIDs (single fast request).
 * Balance/name fetching is deferred to the ImportTokensDialog.
 */
export function useTokenDiscovery({
  isConnected,
  network,
}: UseTokenDiscoveryOptions): UseTokenDiscoveryResult {
  const [discoveredTokenUids, setDiscoveredTokenUids] = useState<string[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const hasDiscoveredRef = useRef(false);
  const prevNetworkRef = useRef(network);

  const dismissKey = `${DISMISS_KEY_PREFIX}${network}`;

  // Check sessionStorage for dismiss state on mount/network change
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(dismissKey);
      setIsDismissed(dismissed === 'true');
    } catch {
      setIsDismissed(false);
    }
  }, [dismissKey]);

  // Reset discovery on network change
  useEffect(() => {
    if (prevNetworkRef.current !== network) {
      prevNetworkRef.current = network;
      hasDiscoveredRef.current = false;
      setDiscoveredTokenUids([]);
    }
  }, [network]);

  const runDiscovery = useCallback(async () => {
    if (!isConnected) return;

    setIsDiscovering(true);
    try {
      const uids = await tokenDiscoveryService.discoverTokenUids(network);
      setDiscoveredTokenUids(uids);

      if (uids.length === 0) {
        try { sessionStorage.removeItem(dismissKey); } catch { /* ignore */ }
        setIsDismissed(false);
      }
    } catch (error) {
      log.error('Token discovery failed:', error);
      setDiscoveredTokenUids([]);
    } finally {
      setIsDiscovering(false);
    }
  }, [isConnected, network, dismissKey]);

  // Run discovery after wallet connects, reset on disconnect
  useEffect(() => {
    if (isConnected && !hasDiscoveredRef.current) {
      hasDiscoveredRef.current = true;
      runDiscovery();
    }
    if (!isConnected) {
      hasDiscoveredRef.current = false;
      setDiscoveredTokenUids([]);
    }
  }, [isConnected, runDiscovery]);

  const dismissBanner = useCallback(() => {
    setIsDismissed(true);
    try { sessionStorage.setItem(dismissKey, 'true'); } catch { /* ignore */ }
  }, [dismissKey]);

  return {
    discoveredTokenUids,
    isDiscovering,
    isDismissed,
    dismissBanner,
    refreshDiscovery: runDiscovery,
  };
}
