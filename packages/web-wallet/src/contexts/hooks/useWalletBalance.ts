import { useState, useCallback } from 'react';
import { readOnlyWalletService } from '../../services/ReadOnlyWalletService';
import { getDisplayAddressForMode, type AddressMode } from '../../utils/addressMode';
import { TOKEN_IDS } from '@/constants';
import type { WalletBalance } from '../../types/wallet';

interface UseWalletBalanceOptions {
  isConnected: boolean;
  addressMode: AddressMode;
  onRefreshTokenBalances: () => Promise<void>;
  onError: (error: string) => void;
}

export function useWalletBalance(options: UseWalletBalanceOptions) {
  const { isConnected, addressMode, onRefreshTokenBalances, onError } = options;
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [address, setAddress] = useState<string>('');

  const refreshBalance = useCallback(async () => {
    if (!isConnected || !readOnlyWalletService.isReady()) return;

    try {
      const newBalances = await readOnlyWalletService.getBalance(TOKEN_IDS.HTR);

      // Also refresh token balances
      await onRefreshTokenBalances();

      setBalances(newBalances);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to refresh balance');
    }
  }, [isConnected, onRefreshTokenBalances, onError]);

  const refreshAddress = async () => {
    if (!isConnected || !readOnlyWalletService.isReady()) return;

    try {
      const newAddress = await getDisplayAddressForMode(addressMode, readOnlyWalletService);
      setAddress(newAddress);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to refresh address. The wallet may not be properly initialized.');
    }
  };

  return {
    balances,
    address,
    setAddress,
    refreshBalance,
    refreshAddress,
  };
}
