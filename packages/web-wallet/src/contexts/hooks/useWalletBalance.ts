import { useState, useCallback, useEffect } from 'react';
import { readOnlyWalletWrapper } from '../../services/ReadOnlyWalletWrapper';
import { getAddressForMode, type AddressMode } from '../../utils/addressMode';
import { TOKEN_IDS } from '@/constants';
import { createLogger } from '../../utils/logger';
import type { WalletBalance } from '../../types/wallet';
import type { TokenInfo } from '../../types/token';

const log = createLogger('useWalletBalance');

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
    if (!isConnected || !readOnlyWalletWrapper.isReady()) {
      return;
    }

    try {
      // Get all token UIDs to fetch (HTR + all registered custom tokens)
      const tokenIds = [TOKEN_IDS.HTR, ...registeredTokens.map(t => t.uid)];

      // Fetch balances for all tokens and merge into single Map
      const allBalances = new Map<string, WalletBalance>();

      await Promise.all(
        tokenIds.map(async (tokenId) => {
          const tokenBalances = await readOnlyWalletWrapper.getBalance(tokenId);

          // Merge the returned Map into our combined Map
          if (tokenBalances.size > 0) {
            tokenBalances.forEach((balance, token) => {
              allBalances.set(token, balance);
            });
          } else {
            // If no balance returned, set to zero instead of omitting
            // This ensures the UI shows 0 instead of stale cached values
            allBalances.set(tokenId, { available: 0n, locked: 0n, token: tokenId });
          }
        })
      );

      setBalances(allBalances);
    } catch (error) {
      log.error('[refreshBalance] Error:', error);
      onError(error instanceof Error ? error.message : 'Failed to refresh balance');
    }
  }, [isConnected, registeredTokens, onError]);

  const refreshAddress = async () => {
    if (!isConnected || !readOnlyWalletWrapper.isReady()) return;

    try {
      const newAddress = await getAddressForMode(addressMode, readOnlyWalletWrapper);
      setAddress(newAddress);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to refresh address. The wallet may not be properly initialized.');
    }
  };

  // Auto-refresh balances when wallet connects or registered tokens change
  useEffect(() => {
    if (isConnected) {
      refreshBalance();
    }
  }, [isConnected, registeredTokens, refreshBalance]);

  return {
    balances,
    address,
    setAddress,
    refreshBalance,
    refreshAddress,
  };
}
