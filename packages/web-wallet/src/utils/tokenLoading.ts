import type { TokenInfo } from '../types/token';
import { readOnlyWalletService } from '../services/ReadOnlyWalletService';
import { tokenRegistryService } from '../services/TokenRegistryService';
import { tokenStorageService } from '../services/TokenStorageService';
import { nftDetectionService } from '../services/NftDetectionService';
import { logger } from './logger';

export interface TokenLoadResult {
  tokens: TokenInfo[];
  warning: string | null;
  failedTokens: Array<{ uid: string; symbol: string; error: string }>;
}

/**
 * Loads tokens for a given network with NFT detection and balance fetching.
 * This consolidates the duplicated logic from checkExistingConnection, connectWallet, and changeNetwork.
 *
 * @param network - The network to load tokens for
 * @param genesisHash - The genesis hash for the network (empty string if not available)
 * @param options - Additional options for token loading
 * @returns Token load result with tokens, warning message, and failed tokens list
 */
export async function loadTokensWithBalances(
  network: string,
  genesisHash: string,
  options: {
    clearNftCache?: boolean;
    detailedErrors?: boolean;
  } = {}
): Promise<TokenLoadResult> {
  const { clearNftCache = false, detailedErrors = true } = options;

  // Clear NFT detection cache if requested
  if (clearNftCache) {
    nftDetectionService.clearCache();
  }

  // Load registered tokens for this network
  const registeredTokens = tokenRegistryService.getRegisteredTokens(network, genesisHash);

  // Detect NFT status for all tokens
  const nftMetadata = await nftDetectionService.detectNftBatch(
    registeredTokens.map(t => t.uid),
    network
  );

  // Update storage with detected NFT statuses and metadata
  let storageNeedsUpdate = false;
  registeredTokens.forEach((token) => {
    const metadata = nftMetadata.get(token.uid);
    const isNft = metadata?.nft ?? false;
    const hasMetadataChange = metadata && !token.metadata;
    const hasNftStatusChange = token.isNFT !== isNft;

    if (hasNftStatusChange || hasMetadataChange) {
      token.isNFT = isNft;
      if (metadata) {
        token.metadata = metadata;
      }
      storageNeedsUpdate = true;
    }
  });

  if (storageNeedsUpdate) {
    tokenStorageService.saveTokens(network, genesisHash, registeredTokens);
  }

  // Fetch balances for all registered tokens
  const failedTokens: Array<{ uid: string; symbol: string; error: string }> = [];
  const tokensWithBalances = await Promise.all(
    registeredTokens.map(async (token) => {
      try {
        const tokenBalances = await readOnlyWalletService.getBalance(token.uid);

        if (tokenBalances && tokenBalances.length > 0) {
          return {
            ...token,
            balance: {
              available: tokenBalances[0].available,
              locked: tokenBalances[0].locked,
            },
          };
        }
        return token;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to fetch balance for token ${token.uid}:`, error);
        failedTokens.push({
          uid: token.uid,
          symbol: token.symbol,
          error: errorMsg,
        });
        return token;
      }
    })
  );

  // Generate warning message based on error tracking mode
  const warning = generateWarningMessage(failedTokens, detailedErrors);

  return {
    tokens: tokensWithBalances,
    warning,
    failedTokens,
  };
}

/**
 * Generates a user-friendly warning message for failed token loads.
 *
 * @param failedTokens - List of tokens that failed to load
 * @param detailedErrors - Whether to include specific token names in the message
 * @returns Warning message or null if no failures
 */
function generateWarningMessage(
  failedTokens: Array<{ uid: string; symbol: string; error: string }>,
  detailedErrors: boolean
): string | null {
  if (failedTokens.length === 0) {
    return null;
  }

  if (detailedErrors) {
    return `Warning: Failed to load balance for: ${failedTokens.map(t => t.symbol).join(', ')}. Showing cached values. Check network connection.`;
  }

  return `Warning: Failed to load balance for ${failedTokens.length} token${failedTokens.length > 1 ? 's' : ''}. Showing cached values.`;
}

/**
 * Fetches the balance for a single token.
 * This is used by refreshTokenBalances and registerToken.
 *
 * @param tokenUid - The token UID to fetch balance for
 * @returns Token balance or null if fetch failed
 */
export async function fetchTokenBalance(tokenUid: string): Promise<{
  available: bigint;
  locked: bigint;
} | null> {
  try {
    const balances = await readOnlyWalletService.getBalance(tokenUid);
    if (balances && balances.length > 0) {
      return {
        available: balances[0].available,
        locked: balances[0].locked,
      };
    }
    return null;
  } catch (error) {
    logger.error(`Failed to fetch balance for token ${tokenUid}:`, error);
    return null;
  }
}
