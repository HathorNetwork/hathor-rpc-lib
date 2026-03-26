import { readOnlyWalletWrapper } from './ReadOnlyWalletWrapper';
import { registeredTokenStorageService } from './RegisteredTokenStorageService';
import { TOKEN_IDS } from '../constants';
import { createLogger } from '../utils/logger';
import type { TokenBalanceInfo } from '../types/wallet';

const log = createLogger('TokenDiscoveryService');

export interface DiscoveredToken extends Partial<TokenBalanceInfo> {
  uid: string;
  isLoadingBalance?: boolean;
}

/**
 * Service for discovering tokens that exist on the user's wallet
 * but are not yet registered in the web wallet.
 *
 * Discovery is split into two phases:
 * 1. Fast: getTokens() returns all token UIDs — used for banner + list
 * 2. Lazy: getBalance(tokenId) fetched on demand with throttling
 */
export class TokenDiscoveryService {
  /**
   * Discover unregistered token UIDs on the wallet (fast, single request).
   * Returns UIDs only — no balance or name/symbol info.
   *
   * Reads registered tokens from storage (not React state) to avoid race
   * conditions where state hasn't been populated yet.
   */
  async discoverTokenUids(network: string): Promise<string[]> {
    if (!readOnlyWalletWrapper.isReady()) {
      log.warn('Wallet not ready, skipping token discovery');
      return [];
    }

    try {
      const allTokenUids = await readOnlyWalletWrapper.getTokens();
      log.debug(`Wallet has ${allTokenUids.length} total tokens`);

      const genesisHash = '';
      // Read from storage directly — always up-to-date, no React state race condition
      const storedTokens = registeredTokenStorageService.loadTokenData(network, genesisHash);
      const registeredUids = new Set<string>(Object.keys(storedTokens));
      registeredUids.add(TOKEN_IDS.HTR);

      const unregisteredUids = allTokenUids.filter(uid => !registeredUids.has(uid));
      log.debug(`Found ${unregisteredUids.length} unregistered token UIDs`);

      return unregisteredUids;
    } catch (error) {
      log.error('Failed to discover tokens:', error);
      throw error;
    }
  }

  /**
   * Fetch balance + name/symbol for a single token.
   */
  async fetchTokenDetails(uid: string): Promise<DiscoveredToken | null> {
    try {
      const balanceInfos = await readOnlyWalletWrapper.getAllTokenBalances(uid);
      const tokenInfo = balanceInfos.find(t => t.uid === uid);

      if (!tokenInfo) return null;

      return {
        uid: tokenInfo.uid,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        balance: tokenInfo.balance,
      };
    } catch (err) {
      log.warn(`Failed to fetch details for token ${uid}:`, err);
      return null;
    }
  }
}

export const tokenDiscoveryService = new TokenDiscoveryService();
