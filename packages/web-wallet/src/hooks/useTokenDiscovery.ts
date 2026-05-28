import { useState, useEffect, useCallback, useRef } from 'react';
import { tokenDiscoveryService } from '../services/TokenDiscoveryService';
import { createLogger } from '../utils/logger';

const log = createLogger('useTokenDiscovery');

const DISMISS_KEY_PREFIX = 'hathor_wallet_token_discovery_dismissed_';

interface UseTokenDiscoveryOptions {
  isConnected: boolean;
  network: string;
  /** Pass newTransaction from WalletContext to re-run discovery on new tx */
  newTransaction?: unknown;
  /** Pass registeredTokens.length so unregister/register triggers re-discovery */
  registeredTokenCount?: number;
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
  newTransaction,
  registeredTokenCount,
}: UseTokenDiscoveryOptions): UseTokenDiscoveryResult {
  const [discoveredTokenUids, setDiscoveredTokenUids] = useState<string[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const hasDiscoveredRef = useRef(false);
  const prevNetworkRef = useRef(network);
  // Mirrors `isDiscovering` state for synchronous reads inside effects/callbacks
  // without needing to add it to dependency arrays (which would cause re-renders
  // and risk feedback loops).
  const isDiscoveringRef = useRef(false);
  // Set when a re-discovery trigger fires while one is already in flight, so we
  // can run exactly one follow-up discovery after the current one finishes
  // (coalescing bursts like bulk token imports into a single extra run).
  const pendingDiscoveryRef = useRef(false);

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

    // Guard against concurrent runs. Triggers fired while a discovery is in
    // flight are coalesced into one follow-up run via `pendingDiscoveryRef`.
    if (isDiscoveringRef.current) {
      pendingDiscoveryRef.current = true;
      return;
    }

    isDiscoveringRef.current = true;
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
      isDiscoveringRef.current = false;
      setIsDiscovering(false);
    }

    // If any trigger fired while we were running, honor it with exactly one
    // follow-up run instead of dropping the signal (e.g. bulk token imports).
    if (pendingDiscoveryRef.current && isConnected) {
      pendingDiscoveryRef.current = false;
      runDiscoveryRef.current?.();
    }
  }, [isConnected, network, dismissKey]);

  // Latest `runDiscovery` reference, used for the self-rescheduling follow-up
  // call above so we don't need to reference the const while it's being
  // initialized.
  const runDiscoveryRef = useRef(runDiscovery);
  useEffect(() => {
    runDiscoveryRef.current = runDiscovery;
  }, [runDiscovery]);

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

  // Re-run discovery on new transactions. Read via ref so the effect fires
  // only on the trigger, not when `runDiscovery`'s identity changes.
  useEffect(() => {
    if (isConnected && newTransaction && hasDiscoveredRef.current) {
      runDiscoveryRef.current?.();
    }
  }, [newTransaction, isConnected]);

  // Re-run discovery on register/unregister so the Import dialog stays in sync.
  useEffect(() => {
    if (isConnected && hasDiscoveredRef.current) {
      runDiscoveryRef.current?.();
    }
  }, [registeredTokenCount, isConnected]);

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
