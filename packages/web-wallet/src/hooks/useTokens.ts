import { useMemo } from 'react';
import { useWallet } from '../contexts/WalletContext';
import type { TokenInfo, TokenFilter } from '../types/token';
import { TOKEN_IDS, HTR_TOKEN_INFO } from '../constants';

/**
 * Custom hook for token operations and filtering
 */
export function useTokens(selectedTokenFilter: TokenFilter = 'all') {
  const {
    registeredTokens,
    registerToken,
    unregisterToken,
    refreshTokenBalances,
    getTokenBalance,
    network,
    balances,
  } = useWallet();

  // Create HTR token info from balances
  const htrToken: TokenInfo = useMemo(() => {
    const htrBalance = balances.length > 0 ? balances[0] : { available: 0n, locked: 0n };
    return {
      uid: TOKEN_IDS.HTR,
      name: HTR_TOKEN_INFO.name,
      symbol: HTR_TOKEN_INFO.symbol,
      balance: {
        available: htrBalance.available,
        locked: htrBalance.locked,
      },
      isNFT: false,
      registeredAt: 0, // HTR is always available
    };
  }, [balances]);

  // Combine HTR with registered tokens
  const allTokens = useMemo(() => {
    return [htrToken, ...registeredTokens];
  }, [htrToken, registeredTokens]);

  // Filter tokens based on selected filter
  const tokens = useMemo(() => {
    if (selectedTokenFilter === 'all') {
      return allTokens;
    }
    if (selectedTokenFilter === 'tokens') {
      return allTokens.filter(t => !t.isNFT);
    }
    if (selectedTokenFilter === 'nfts') {
      return allTokens.filter(t => t.isNFT);
    }
    return allTokens;
  }, [allTokens, selectedTokenFilter]);

  // Calculate counts
  const tokenCount = useMemo(() => {
    return allTokens.filter(t => !t.isNFT).length;
  }, [allTokens]);

  const nftCount = useMemo(() => {
    return allTokens.filter(t => t.isNFT).length;
  }, [allTokens]);

  // Calculate custom token count (excluding HTR)
  const customTokenCount = useMemo(() => {
    return registeredTokens.filter(t => !t.isNFT).length;
  }, [registeredTokens]);

  return {
    tokens,
    allTokens,
    tokenCount,
    nftCount,
    customTokenCount,
    registerToken,
    unregisterToken,
    refreshTokenBalances,
    getTokenBalance,
    network,
    htrToken,
  };
}
