import { useState, useCallback } from 'react';
import { readOnlyWalletService } from '../../services/ReadOnlyWalletService';
import { getDisplayAddressForMode, type AddressMode } from '../../utils/addressMode';
import { TOKEN_IDS } from '@/constants';
import type { WalletBalance } from '../../types/wallet';
import type { TokenInfo } from '../../types/token';

interface UseWalletBalanceOptions {
  isConnected: boolean;
  addressMode: AddressMode;
  registeredTokens: TokenInfo[];
  onError: (error: string) => void;
}

export function useWalletBalance(options: UseWalletBalanceOptions) {
  const { isConnected, addressMode, registeredTokens, onError } = options;
  const [balances, setBalances] = useState<Map<string, WalletBalance>>(new Map());
  const [address, setAddress] = useState<string>('');

  const refreshBalance = useCallback(async () => {
    if (!isConnected || !readOnlyWalletService.isReady()) return;

    try {
      // Get all token UIDs to fetch (HTR + all registered custom tokens)
      const tokenIds = [TOKEN_IDS.HTR, ...registeredTokens.map(t => t.uid)];

      // Fetch balances for all tokens and merge into single Map
      const allBalances = new Map<string, WalletBalance>();

      await Promise.all(
        tokenIds.map(async (tokenId) => {
          const tokenBalances = await readOnlyWalletService.getBalance(tokenId);
          // Merge the returned Map into our combined Map
          tokenBalances.forEach((balance, token) => {
            allBalances.set(token, balance);
          });
        })
      );

      setBalances(allBalances);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to refresh balance');
    }
  }, [isConnected, registeredTokens, onError]);

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
