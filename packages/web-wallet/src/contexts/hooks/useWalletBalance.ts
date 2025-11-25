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
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [address, setAddress] = useState<string>('');

  const refreshBalance = useCallback(async () => {
    if (!isConnected || !readOnlyWalletService.isReady()) return;

    try {
      // Get all token UIDs to fetch (HTR + all registered custom tokens)
      const tokenIds = [TOKEN_IDS.HTR, ...registeredTokens.map(t => t.uid)];

      // Fetch balances for all tokens
      const allBalances = await Promise.all(
        tokenIds.map(async (tokenId) => {
          const tokenBalances = await readOnlyWalletService.getBalance(tokenId);
          return tokenBalances[0]; // getBalance returns array, we take first element
        })
      );
      // Filter out any undefined/null
      // XXX: This is needed because the wallet-service returns null, but will be
      // changed to return 0 so it matches the fullnode facade.
      setBalances(allBalances.filter(Boolean));
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
