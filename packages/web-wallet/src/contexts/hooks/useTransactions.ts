import { useState } from 'react';
import { readOnlyWalletService } from '../../services/ReadOnlyWalletService';
import { WalletServiceMethods } from '../../services/HathorWalletService';
import { TOKEN_IDS } from '@/constants';
import { createLogger } from '../../utils/logger';
import type { TransactionHistoryItem } from '../../types/wallet';

const log = createLogger('useTransactions');

interface SendTransactionParams {
  network: string;
  outputs: Array<{
    address?: string;
    value?: string;
    token?: string;
    type?: string;
    data?: string;
  }>;
  inputs?: Array<{ txId: string; index: number }>;
  changeAddress?: string;
}

interface UseTransactionsOptions {
  isConnected: boolean;
  invokeSnap: (params: { method: string; params?: Record<string, unknown> }) => Promise<unknown>;
  onError: (error: string) => void;
  onSnapError: (error: unknown) => void;
}

export function useTransactions(options: UseTransactionsOptions) {
  const { isConnected, invokeSnap, onError, onSnapError } = options;
  const [newTransaction, setNewTransaction] = useState<unknown | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(0);

  const getTransactionHistory = async (
    count: number = 10,
    skip: number = 0,
    tokenId: string = TOKEN_IDS.HTR
  ): Promise<TransactionHistoryItem[]> => {
    if (!isConnected || !readOnlyWalletService.isReady()) {
      // Return empty for disconnected state - this is expected
      return [];
    }

    try {
      return await readOnlyWalletService.getTransactionHistory(count, skip, tokenId);
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);

      // Set error in state so UI can show it
      onError('Failed to load transaction history. Please try again.');

      // Still return empty array, but user knows WHY it's empty
      return [];
    }
  };

  const sendTransaction = async (params: SendTransactionParams) => {
    log.debug('sendTransaction wrapper called');
    log.debug('Transaction params:', params);
    log.debug('Wallet connected:', isConnected);

    try {
      const result = await WalletServiceMethods.sendTransaction(invokeSnap, params);
      log.info('Transaction completed successfully');
      return result;
    } catch (error) {
      log.error('Transaction failed in wrapper:', error);
      onSnapError(error);
    }
  };

  const setHistoryDialogState = (isOpen: boolean, page: number = 0) => {
    setIsHistoryDialogOpen(isOpen);
    setCurrentHistoryPage(page);
    // Clear new transaction when opening dialog or changing pages
    setNewTransaction(null);
  };

  const clearNewTransaction = () => {
    setNewTransaction(null);
  };

  return {
    newTransaction,
    isHistoryDialogOpen,
    currentHistoryPage,
    setNewTransaction,
    getTransactionHistory,
    sendTransaction,
    setHistoryDialogState,
    clearNewTransaction,
  };
}

export type { SendTransactionParams };
