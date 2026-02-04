import { useInvokeSnap, useMetaMaskContext } from '@hathor/snap-utils';
import { useState, useEffect, useCallback } from 'react';
import { DICE_CONTRACT_CONFIG } from '@/config/contract';
import type { WalletInfo } from '@/lib/hathor/types';

export function useHathorWallet() {
  const { installedSnap } = useMetaMaskContext();
  const invokeSnap = useInvokeSnap();
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchWalletInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get wallet address
      const addressResponse = await invokeSnap({
        method: 'htr_getAddress',
        params: { network: DICE_CONTRACT_CONFIG.network },
      });

      // Get connected network
      const networkResponse = await invokeSnap({
        method: 'htr_getConnectedNetwork',
        params: {},
      });

      // Get wallet information (optional - includes more details)
      const walletResponse = await invokeSnap({
        method: 'htr_getWalletInformation',
        params: { network: DICE_CONTRACT_CONFIG.network },
      });

      if (
        addressResponse.type === 'GetAddressResponse' &&
        networkResponse.type === 'GetConnectedNetworkResponse'
      ) {
        setWalletInfo({
          address: addressResponse.response,
          network: networkResponse.response,
          xpub: walletResponse.type === 'GetWalletInformationResponse'
            ? walletResponse.response.xpub
            : undefined,
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch wallet info');
      setError(error);
      console.error('Failed to fetch wallet info:', error);
    } finally {
      setIsLoading(false);
    }
  }, [invokeSnap]);

  useEffect(() => {
    if (installedSnap) {
      fetchWalletInfo();
    }
  }, [installedSnap, fetchWalletInfo]);

  return { walletInfo, isLoading, error, refetch: fetchWalletInfo };
}
