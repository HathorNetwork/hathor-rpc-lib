import { useState, useCallback, useRef, useEffect } from 'react';
import { tokenRegistryService } from '../../services/TokenRegistryService';
import { readOnlyWalletWrapper } from '../../services/ReadOnlyWalletWrapper';
import { loadTokensWithBalances, fetchTokenBalance, type TokenLoadResult } from '../../utils/tokenLoading';
import { TOKEN_IDS } from '@/constants';
import { createLogger } from '../../utils/logger';
import type { TokenInfo, TokenFilter } from '../../types/token';

const log = createLogger('useTokenState');

interface UseTokenStateOptions {
  isConnected: boolean;
  network: string;
}

/**
 * Unified token state hook - the SINGLE SOURCE OF TRUTH for registered tokens.
 *
 * This hook owns the registeredTokens state and provides:
 * - Token CRUD operations (register, unregister)
 * - Token loading for network changes
 * - A ref that always points to current tokens (for race-free callbacks)
 *
 * The registeredTokensRef is critical: callbacks (like WebSocket handlers) can read
 * registeredTokensRef.current to always get the latest tokens, avoiding race conditions
 * where state hasn't propagated yet.
 */
export function useTokenState(options: UseTokenStateOptions) {
  const { isConnected, network } = options;

  // THE single source of truth for registered tokens
  const [registeredTokens, setRegisteredTokens] = useState<TokenInfo[]>([]);
  const [selectedTokenFilter, setSelectedTokenFilter] = useState<TokenFilter>('tokens');

  // Ref that always points to current tokens - use this in callbacks to avoid stale closures
  const registeredTokensRef = useRef<TokenInfo[]>([]);

  // Keep ref in sync with state (runs synchronously after state update)
  useEffect(() => {
    registeredTokensRef.current = registeredTokens;
  }, [registeredTokens]);

  /**
   * Load tokens for a network (used during connection and network changes)
   */
  const loadTokensForNetwork = useCallback(async (
    targetNetwork: string,
    options: { clearNftCache?: boolean; detailedErrors?: boolean } = {}
  ): Promise<TokenLoadResult> => {
    const genesisHash = '';
    const result = await loadTokensWithBalances(targetNetwork, genesisHash, options);
    // CRITICAL: Update ref synchronously for race-free access
    registeredTokensRef.current = result.tokens;
    setRegisteredTokens(result.tokens);
    return result;
  }, []);

  /**
   * Register a new token
   */
  const registerToken = useCallback(async (configString: string) => {
    if (!isConnected || !readOnlyWalletWrapper.isReady()) {
      throw new Error('Wallet not connected');
    }

    try {
      const genesisHash = '';
      log.debug('Registering token...');

      const tokenInfo = await tokenRegistryService.registerToken(
        configString,
        network,
        genesisHash
      );
      log.debug('Token registered:', { uid: tokenInfo.uid, isNFT: tokenInfo.isNFT, symbol: tokenInfo.symbol });

      // Fetch balance immediately after registration
      const balance = await fetchTokenBalance(tokenInfo.uid);
      if (balance) {
        tokenInfo.balance = balance;
      }
      log.debug('Balance fetched:', tokenInfo.balance);

      // CRITICAL: Compute new tokens and update ref BEFORE setState.
      // setState callbacks don't run synchronously, but ref updates must be immediate
      // so that WebSocket callbacks see the latest tokens.
      const currentTokens = registeredTokensRef.current;
      const existingIndex = currentTokens.findIndex(t => t.uid === tokenInfo.uid);
      let newTokens: TokenInfo[];
      if (existingIndex >= 0) {
        log.debug('Updating existing token at index', existingIndex);
        newTokens = [...currentTokens];
        newTokens[existingIndex] = tokenInfo;
      } else {
        log.debug('Adding new token, total will be:', currentTokens.length + 1);
        newTokens = [...currentTokens, tokenInfo];
      }

      // Update ref synchronously BEFORE setState
      registeredTokensRef.current = newTokens;

      // Then update React state to match
      setRegisteredTokens(newTokens);
      log.debug('State updated with token');
    } catch (error) {
      log.error('Failed to register token:', error);
      throw error;
    }
  }, [isConnected, network]);

  /**
   * Unregister a token
   */
  const unregisterToken = useCallback(async (tokenUid: string) => {
    if (!isConnected) {
      throw new Error('Wallet is not connected');
    }

    if (tokenUid === TOKEN_IDS.HTR) {
      log.error('Cannot unregister HTR token');
      throw new Error('Cannot unregister the native HTR token');
    }

    try {
      const genesisHash = '';
      tokenRegistryService.unregisterToken(tokenUid, network, genesisHash);

      // CRITICAL: Update ref synchronously BEFORE setState
      const newTokens = registeredTokensRef.current.filter(t => t.uid !== tokenUid);
      registeredTokensRef.current = newTokens;
      setRegisteredTokens(newTokens);
    } catch (error) {
      log.error('Failed to unregister token:', error);
      throw error;
    }
  }, [isConnected, network]);

  /**
   * Get info for a specific token
   */
  const getTokenInfo = useCallback((tokenUid: string): TokenInfo | undefined => {
    return registeredTokensRef.current.find(t => t.uid === tokenUid);
  }, []);

  /**
   * Clear all tokens (used on disconnect)
   */
  const clearTokens = useCallback(() => {
    // CRITICAL: Update ref synchronously for race-free access
    registeredTokensRef.current = [];
    setRegisteredTokens([]);
  }, []);

  return {
    // State
    registeredTokens,
    selectedTokenFilter,

    // The ref for race-free access in callbacks
    registeredTokensRef,

    // Setters
    setSelectedTokenFilter,

    // Operations
    registerToken,
    unregisterToken,
    loadTokensForNetwork,
    getTokenInfo,
    clearTokens,
  };
}
