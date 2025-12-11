import type { TokenInfo } from '../types/token';
import { readOnlyWalletWrapper } from '../services/ReadOnlyWalletWrapper';
import { tokenRegistryService } from '../services/TokenRegistryService';
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

  // Detect NFT status for all tokens (non-blocking - failures don't affect balance loading)
  try {
    const nftMetadata = await nftDetectionService.detectNftBatch(
      registeredTokens.map(t => t.uid),
      network
    );

    // Update metadata storage with detected NFT statuses
    // This only updates metadata, leaving token data unchanged
    registeredTokens.forEach((token) => {
      const metadata = nftMetadata.get(token.uid);
      const isNft = metadata?.nft ?? false;
      const hasMetadataChange = metadata && !token.metadata;
      const hasNftStatusChange = token.isNFT !== isNft;

      if (hasNftStatusChange || hasMetadataChange) {
        // Update metadata only (not data)
        tokenRegistryService.updateTokenMetadata(token.uid, network, genesisHash, {
          isNFT: isNft,
          metadata: metadata || undefined,
        });

        // Update the in-memory token for this load
        token.isNFT = isNft;
        if (metadata) {
          token.metadata = metadata;
        }
      }
    });
  } catch (error) {
    // NFT metadata detection failed - continue with balance loading
    // Tokens will use their cached/default isNFT status
    logger.warn('Failed to detect NFT metadata, continuing with cached values:', error);
  }

  // Fetch balances for all registered tokens
  const failedTokens: Array<{ uid: string; symbol: string; error: string }> = [];
  const tokensWithBalances = await Promise.all(
    registeredTokens.map(async (token) => {
      const balance = await fetchTokenBalance(token.uid);

      if (balance) {
        return {
          ...token,
          balance,
        };
      }

      // fetchTokenBalance returns null on error (already logged)
      failedTokens.push({
        uid: token.uid,
        symbol: token.symbol,
        error: 'Failed to fetch balance',
      });
      return token;
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
    const balances = await readOnlyWalletWrapper.getBalance(tokenUid);
    const balance = balances.get(tokenUid);
    // Return balance if found, otherwise return zero balance (token exists but has no balance).
    // TODO: Remove this fallback after https://github.com/HathorNetwork/hathor-wallet-service/pull/324
    // is merged - wallet-service will then always return balance for registered tokens.
    return {
      available: balance?.available ?? 0n,
      locked: balance?.locked ?? 0n,
    };
  } catch (error) {
    logger.error(`Failed to fetch balance for token ${tokenUid}:`, error);
    return null;
  }
}
