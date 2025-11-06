'use client';

import { useState, useEffect } from 'react';
import { useInvokeSnap } from '@hathor/snap-utils';

const NETWORKS = ['mainnet', 'testnet'] as const;
type Network = typeof NETWORKS[number];

export function NetworkSwitcher() {
  const invokeSnap = useInvokeSnap();
  const [currentNetwork, setCurrentNetwork] = useState<Network>('testnet');
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    loadCurrentNetwork();
  }, []);

  const loadCurrentNetwork = async () => {
    try {
      const response = await invokeSnap({
        method: 'htr_getConnectedNetwork',
        params: {},
      });

      if (response.type === 'GetConnectedNetworkResponse') {
        setCurrentNetwork(response.response as Network);
      }
    } catch (error) {
      console.error('Failed to load network:', error);
    }
  };

  const handleNetworkChange = async (network: Network) => {
    if (network === currentNetwork || isChanging) return;

    setIsChanging(true);
    try {
      await invokeSnap({
        method: 'htr_changeNetwork',
        params: { network },
      });
      setCurrentNetwork(network);
    } catch (error) {
      console.error('Failed to change network:', error);
      // Optionally show error toast here
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Network:</span>
      <select
        value={currentNetwork}
        onChange={(e) => handleNetworkChange(e.target.value as Network)}
        disabled={isChanging}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-hathor-primary disabled:opacity-50"
      >
        {NETWORKS.map((net) => (
          <option key={net} value={net}>
            {net.charAt(0).toUpperCase() + net.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
