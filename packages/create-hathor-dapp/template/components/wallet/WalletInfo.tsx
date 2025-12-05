'use client';

import { useEffect, useState, useCallback } from 'react';
import { useInvokeSnap } from '@hathor/snap-utils';
import { DICE_CONTRACT_CONFIG } from '@/config/contract';
import { shortenAddress } from '@/lib/hathor/utils';

export function WalletInfo() {
  const invokeSnap = useInvokeSnap();
  const [address, setAddress] = useState<string>('');
  const [network, setNetwork] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const loadWalletInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get address
      const addressResponse = await invokeSnap({
        method: 'htr_getAddress',
        params: { network: DICE_CONTRACT_CONFIG.network },
      });

      if (addressResponse.type === 'GetAddressResponse') {
        setAddress(addressResponse.response);
      }

      // Get network
      const networkResponse = await invokeSnap({
        method: 'htr_getConnectedNetwork',
        params: {},
      });

      if (networkResponse.type === 'GetConnectedNetworkResponse') {
        setNetwork(networkResponse.response);
      }
    } catch (error) {
      console.error('Failed to load wallet info:', error);
    } finally {
      setIsLoading(false);
    }
  }, [invokeSnap]);

  useEffect(() => {
    loadWalletInfo();
  }, [loadWalletInfo]);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow">
        <div className="animate-spin h-4 w-4 border-2 border-hathor-primary border-t-transparent rounded-full"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg shadow">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm font-medium text-gray-700">
          {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
        </span>
      </div>
      <div className="h-4 w-px bg-gray-300"></div>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-mono text-gray-700">
          {shortenAddress(address)}
        </span>
      </div>
    </div>
  );
}
