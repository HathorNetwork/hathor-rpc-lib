/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { DEFAULT_NETWORK, NETWORK_STORAGE_KEY } from '../constants';

interface NetworkContextType {
  /** Active Hathor network (e.g. 'mainnet', 'testnet'). */
  network: string;
  /** Sets the active network and persists it to localStorage. */
  setNetwork: (network: string) => void;
  /** Resets the network to the default and removes it from localStorage. */
  clearNetwork: () => void;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

interface NetworkProviderProps {
  children: ReactNode;
}

/**
 * Single source of truth for the active Hathor network.
 *
 * Lives above both the FeatureToggleProvider and the WalletProvider so the
 * network can flow down to consumers via React context instead of a side
 * channel. The wallet hooks remain the ones that decide/validate the network
 * (via the snap), but they read and write it here. Persistence to localStorage
 * is centralized in this provider so there is exactly one place that owns the
 * stored value.
 */
export function NetworkProvider({ children }: NetworkProviderProps) {
  const [network, setNetworkState] = useState<string>(
    () => localStorage.getItem(NETWORK_STORAGE_KEY) || DEFAULT_NETWORK
  );

  const setNetwork = useCallback((nextNetwork: string) => {
    setNetworkState(nextNetwork);
    localStorage.setItem(NETWORK_STORAGE_KEY, nextNetwork);
  }, []);

  const clearNetwork = useCallback(() => {
    setNetworkState(DEFAULT_NETWORK);
    localStorage.removeItem(NETWORK_STORAGE_KEY);
  }, []);

  return (
    <NetworkContext.Provider value={{ network, setNetwork, clearNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
