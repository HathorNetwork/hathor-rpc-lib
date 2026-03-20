import { useState, useCallback } from 'react';
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
  /**
   * Ref to registered tokens - use ref instead of array to avoid race conditions.
   * The ref always points to the latest tokens, so callbacks can read current values
   * without depending on stale closure captures.
   */
  registeredTokensRef: React.RefObject<TokenInfo[]>;
  onError: (error: string) => void;
}

export function useWalletBalance(options: UseWalletBalanceOptions) {
  const { isConnected, addressMode, registeredTokensRef, onError } = options;
  const [balances, setBalances] = useState<Map<string, WalletBalance>>(new Map());
  const [address, setAddress] = useState<string>('');

  /**
   * Refresh balances for HTR and all registered tokens.
   *
   * IMPORTANT: This reads from registeredTokensRef.current to always get the latest
   * token list, avoiding race conditions where state hasn't propagated yet.
   */
  const refreshBalance = useCallback(async () => {
    if (!isConnected || !readOnlyWalletWrapper.isReady()) {
      return;
    }

    try {
      // Read current tokens from ref - this is always up to date
      const currentTokens = registeredTokensRef.current;
      const tokenIds = [TOKEN_IDS.HTR, ...currentTokens.map(t => t.uid)];

      log.debug('[refreshBalance] Fetching balances for tokens:', tokenIds);

      // Fetch balances for all tokens and merge into single Map
      const allBalances = new Map<string, WalletBalance>();

      await Promise.all(
        tokenIds.map(async (tokenId) => {
          const tokenBalances = await readOnlyWalletWrapper.getBalance(tokenId);

          log.debug('[refreshBalance] Got balance for', tokenId, '- map size:', tokenBalances.size);

          // Merge the returned Map into our combined Map
          if (tokenBalances.size > 0) {
            tokenBalances.forEach((balance, token) => {
              log.debug('[refreshBalance] Setting balance for token:', token, 'available:', balance.available?.toString());
              allBalances.set(token, balance);
            });
          } else {
            // If no balance returned, set to zero instead of omitting
            // This ensures the UI shows 0 instead of stale cached values
            log.debug('[refreshBalance] No balance returned for', tokenId, '- setting to 0');
            allBalances.set(tokenId, { available: 0n, locked: 0n, token: tokenId });
          }
        })
      );

      log.debug('[refreshBalance] Final balances map size:', allBalances.size);
      setBalances(allBalances);
    } catch (error) {
      log.error('[refreshBalance] Error:', error);
      onError(error instanceof Error ? error.message : 'Failed to refresh balance');
    }
  }, [isConnected, registeredTokensRef, onError]);

  /**
   * Refresh balances for specific tokens only.
   * Use this for targeted updates (e.g., after WebSocket transaction events)
   * instead of refreshing all tokens.
   */
  const refreshBalanceForTokens = useCallback(async (tokenIds: string[]) => {
    if (!isConnected || !readOnlyWalletWrapper.isReady() || tokenIds.length === 0) {
      return;
    }

    try {
      log.debug('[refreshBalanceForTokens] Fetching balances for tokens:', tokenIds);

      // Fetch balances for specified tokens
      const updatedBalances = new Map<string, WalletBalance>();

      await Promise.all(
        tokenIds.map(async (tokenId) => {
          const tokenBalances = await readOnlyWalletWrapper.getBalance(tokenId);

          if (tokenBalances.size > 0) {
            tokenBalances.forEach((balance, token) => {
              updatedBalances.set(token, balance);
            });
          } else {
            updatedBalances.set(tokenId, { available: 0n, locked: 0n, token: tokenId });
          }
        })
      );

      // Merge updated balances into existing balances
      setBalances(prev => {
        const merged = new Map(prev);
        updatedBalances.forEach((balance, token) => {
          merged.set(token, balance);
        });
        return merged;
      });

      log.debug('[refreshBalanceForTokens] Updated', updatedBalances.size, 'token balances');
    } catch (error) {
      log.error('[refreshBalanceForTokens] Error:', error);
      onError(error instanceof Error ? error.message : 'Failed to refresh token balances');
    }
  }, [isConnected, onError]);

  const refreshAddress = useCallback(async () => {
    if (!isConnected || !readOnlyWalletWrapper.isReady()) return;

    try {
      const newAddress = await getAddressForMode(addressMode, readOnlyWalletWrapper);
      setAddress(newAddress);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to refresh address. The wallet may not be properly initialized.');
    }
  }, [isConnected, addressMode, onError]);

  return {
    balances,
    address,
    setAddress,
    setBalances,
    refreshBalance,
    refreshBalanceForTokens,
    refreshAddress,
  };
}
