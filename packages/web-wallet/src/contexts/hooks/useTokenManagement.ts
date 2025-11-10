import { useState, useCallback } from 'react';
import { tokenRegistryService } from '../../services/TokenRegistryService';
import { readOnlyWalletService } from '../../services/ReadOnlyWalletService';
import { fetchTokenBalance } from '../../utils/tokenLoading';
import { TOKEN_IDS } from '@/constants';
import { createLogger } from '../../utils/logger';
import type { TokenInfo, TokenFilter } from '../../types/token';

const log = createLogger('useTokenManagement');

interface UseTokenManagementOptions {
  isConnected: boolean;
  network: string;
}

export function useTokenManagement(options: UseTokenManagementOptions) {
  const { isConnected, network } = options;
  const [registeredTokens, setRegisteredTokens] = useState<TokenInfo[]>([]);
  const [selectedTokenFilter, setSelectedTokenFilter] = useState<TokenFilter>('tokens');

  const refreshTokenBalances = useCallback(async () => {
    if (!isConnected || !readOnlyWalletService.isReady()) return;

    try {
      // Fetch balances for all tokens
      const balanceUpdates = await Promise.all(
        registeredTokens.map(async (token) => {
          const balance = await fetchTokenBalance(token.uid);
          if (balance) {
            return {
              uid: token.uid,
              balance,
            };
          }
          return null;
        })
      );

      // Update tokens by merging balance updates
      setRegisteredTokens(prev => prev.map(token => {
        const update = balanceUpdates.find(u => u && u.uid === token.uid);
        if (update) {
          return { ...token, balance: update.balance };
        }
        return token;
      }));
    } catch (error) {
      log.error('Failed to refresh token balances:', error);
    }
  }, [isConnected, registeredTokens]);

  const registerToken = async (configString: string) => {
    if (!isConnected || !readOnlyWalletService.isReady()) {
      throw new Error('Wallet not connected');
    }

    try {
      // genesisHash is empty string for now (TODO in RPC handler)
      const genesisHash = '';
      log.debug('Registering token...');
      const tokenInfo = await tokenRegistryService.registerToken(
        configString,
        network,
        genesisHash
      );
      log.info('Token registered:', { uid: tokenInfo.uid, isNFT: tokenInfo.isNFT, symbol: tokenInfo.symbol });

      // Fetch balance immediately after registration
      const balance = await fetchTokenBalance(tokenInfo.uid);
      if (balance) {
        tokenInfo.balance = balance;
      }
      log.debug('Balance fetched:', tokenInfo.balance);

      // Update state with new or updated token
      setRegisteredTokens(prev => {
        const existingIndex = prev.findIndex(t => t.uid === tokenInfo.uid);
        if (existingIndex >= 0) {
          // Update existing token
          log.debug('Updating existing token at index', existingIndex);
          const updatedTokens = [...prev];
          updatedTokens[existingIndex] = tokenInfo;
          return updatedTokens;
        } else {
          // Add new token
          log.debug('Adding new token, total will be:', prev.length + 1);
          return [...prev, tokenInfo];
        }
      });
      log.debug('State updated with token');
    } catch (error) {
      log.error('Failed to register token:', error);
      throw error;
    }
  };

  const unregisterToken = async (tokenUid: string) => {
    if (!isConnected) {
      throw new Error('Wallet is not connected');
    }

    // Prevent HTR from being unregistered
    if (tokenUid === TOKEN_IDS.HTR) {
      log.error('Cannot unregister HTR token');
      throw new Error('Cannot unregister the native HTR token');
    }

    try {
      const genesisHash = '';
      tokenRegistryService.unregisterToken(tokenUid, network, genesisHash);

      // Update state
      setRegisteredTokens(prev => prev.filter(t => t.uid !== tokenUid));
    } catch (error) {
      log.error('Failed to unregister token:', error);
      throw error;
    }
  };

  const getTokenBalance = (tokenUid: string): TokenInfo | undefined => {
    return registeredTokens.find(t => t.uid === tokenUid);
  };

  return {
    registeredTokens,
    selectedTokenFilter,
    setRegisteredTokens,
    setSelectedTokenFilter,
    refreshTokenBalances,
    registerToken,
    unregisterToken,
    getTokenBalance,
  };
}
