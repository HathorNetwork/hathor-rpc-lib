import metadataApi from '@hathor/wallet-lib/lib/api/metadataApi';
import type { DagMetadata } from '../types/token';

/**
 * Service for detecting NFT tokens using wallet-lib metadata API
 */
export class NftDetectionService {
  private cache: Map<string, DagMetadata | null> = new Map();

  /**
   * Detect if a token is an NFT by querying metadata API
   * Returns metadata or null on error/not found
   */
  async detectNft(tokenId: string, network: string): Promise<DagMetadata | null> {
    // Check cache first
    if (this.cache.has(tokenId)) {
      return this.cache.get(tokenId)!;
    }

    try {
      const metadata = await metadataApi.getDagMetadata(tokenId, network, {
        retries: 2,
        retryInterval: 500,
      });

      // The API returns an object with the token ID as key: { [tokenId]: { nft: true, ... } }
      // We need to unwrap it first
      const tokenMetadata = metadata?.[tokenId as keyof typeof metadata] as DagMetadata | undefined;

      // Cache result (even if null)
      this.cache.set(tokenId, tokenMetadata || null);

      return tokenMetadata || null;
    } catch (error) {
      console.warn(`Failed to detect NFT status for token ${tokenId}:`, error);
      // Cache null result
      this.cache.set(tokenId, null);
      return null;
    }
  }

  /**
   * Detect NFT status for multiple tokens efficiently
   * Uses Promise.allSettled to handle partial failures
   */
  async detectNftBatch(
    tokenIds: string[],
    network: string
  ): Promise<Map<string, DagMetadata | null>> {
    const results = new Map<string, DagMetadata | null>();

    // Filter out already cached tokens
    const uncached = tokenIds.filter(id => !this.cache.has(id));
    const cached = tokenIds.filter(id => this.cache.has(id));

    // Add cached results immediately
    cached.forEach(id => {
      results.set(id, this.cache.get(id)!);
    });

    // Fetch uncached in parallel
    const promises = uncached.map(async (tokenId) => ({
      tokenId,
      metadata: await this.detectNft(tokenId, network),
    }));

    const settled = await Promise.allSettled(promises);

    settled.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.set(result.value.tokenId, result.value.metadata);
      }
    });

    return results;
  }

  /**
   * Clear detection cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const nftDetectionService = new NftDetectionService();
