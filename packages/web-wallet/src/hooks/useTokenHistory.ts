import { useState, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';
import type { TransactionHistoryItem } from '../contexts/WalletContext';

/**
 * Custom hook for managing token-specific transaction history
 */
export function useTokenHistory(tokenUid: string) {
  const { getTransactionHistory } = useWallet();
  const [history, setHistory] = useState<TransactionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadHistory = useCallback(
    async (count = 10, skip = 0) => {
      setIsLoading(true);
      try {
        const items = await getTransactionHistory(count, skip, tokenUid);

        if (items.length < count) {
          setHasMore(false);
        }

        if (skip === 0) {
          // Initial load or refresh
          setHistory(items);
        } else {
          // Load more
          setHistory(prev => [...prev, ...items]);
        }
      } catch (error) {
        console.error('Failed to load transaction history:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [tokenUid, getTransactionHistory]
  );

  const refresh = useCallback(() => {
    // Reset hasMore since we're starting fresh and don't know if there are more pages
    setHasMore(true);
    return loadHistory(10, 0);
  }, [loadHistory]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      return loadHistory(10, history.length);
    }
  }, [isLoading, hasMore, history.length, loadHistory]);

  return {
    history,
    isLoading,
    hasMore,
    loadHistory,
    refresh,
    loadMore,
  };
}
