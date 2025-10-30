import React, { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownLeft, ExternalLink, Loader2, ArrowLeft, Clock } from 'lucide-react'
import { useWallet } from '../contexts/WalletContext'
import { useTokens } from '../hooks/useTokens'
import type { TransactionHistoryItem } from '../contexts/WalletContext'
import { formatHTRAmount } from '../utils/hathor'
import { HATHOR_EXPLORER_URLS, NETWORKS, TOKEN_IDS } from '../constants'
import Header from './Header'
import UnregisterTokenDialog from './UnregisterTokenDialog'

interface HistoryDialogProps {
  isOpen: boolean
  onClose: () => void
  tokenUid?: string
  onRegisterTokenClick?: () => void
}

interface ProcessedTransaction {
  id: string
  type: 'sent' | 'received'
  amount: number
  timestamp: string
  txHash: string
  status: 'confirmed' | 'pending'
}

const HistoryDialog: React.FC<HistoryDialogProps> = ({ isOpen, onClose, tokenUid, onRegisterTokenClick }) => {
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentCount, setCurrentCount] = useState(0)
  const [unregisterDialogOpen, setUnregisterDialogOpen] = useState(false)
  const PAGE_SIZE = 10
  const { address, network, getTransactionHistory, newTransaction, setHistoryDialogState, clearNewTransaction, unregisterToken } = useWallet()
  const { allTokens } = useTokens()

  // Get token info for display
  const selectedToken = React.useMemo(() => {
    const uid = tokenUid || TOKEN_IDS.HTR;
    return allTokens.find(t => t.uid === uid);
  }, [allTokens, tokenUid]);

  useEffect(() => {
    if (isOpen && address) {
      // Notify context that dialog is open on page 0 (page 1 in UI)
      setHistoryDialogState(true, 0)
      // Reset pagination when dialog opens
      setTransactions([])
      setCurrentCount(0)
      setHasMore(true)
      loadTransactionHistory(0)
    } else if (!isOpen) {
      // Notify context that dialog is closed
      setHistoryDialogState(false, 0)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, address])

  // Handle incoming new transactions from WebSocket
  useEffect(() => {
    if (!newTransaction || !isOpen) return;

    // Type guard to check if this is a history transaction
    const transaction = newTransaction as Record<string, unknown>;

    // Only process if we have transaction data with tx_id (for history list)
    if (transaction.tx_id) {
      const balanceValue = typeof transaction.balance === 'bigint'
        ? Number(transaction.balance)
        : (transaction.balance as number);
      const type = balanceValue >= 0 ? 'received' : 'sent'
      const amount = Math.abs(balanceValue)

      const processedTx: ProcessedTransaction = {
        id: transaction.tx_id as string,
        type,
        amount,
        timestamp: new Date((transaction.timestamp as number) * 1000).toISOString(),
        txHash: transaction.tx_id as string,
        status: !(transaction.is_voided as boolean) ? 'confirmed' : 'pending'
      };

      // Use functional update to avoid race conditions with duplicate check
      setTransactions(prev => {
        const isDuplicate = prev.some(tx => tx.id === transaction.tx_id);
        if (isDuplicate) return prev;
        return [processedTx, ...prev].slice(0, PAGE_SIZE);
      });

      setCurrentCount(prev => prev + 1);

      // Clear the transaction from context
      clearNewTransaction();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTransaction, isOpen]);

  const loadTransactionHistory = async (skip: number = 0) => {
    if (!address) {
      return;
    }

    const isInitialLoad = skip === 0;
    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    // Calculate page number (0-indexed)
    const pageNum = Math.floor(skip / PAGE_SIZE);

    // Use provided tokenUid or default to HTR
    const activeTokenUid = tokenUid || TOKEN_IDS.HTR;

    try {
      const history = await getTransactionHistory(PAGE_SIZE, skip, activeTokenUid)

      if (!history || history.length === 0) {
        setHasMore(false);
        if (isInitialLoad) {
          setTransactions([]);
        }
        return;
      }

      if (history.length < PAGE_SIZE) {
        setHasMore(false);
      }

      const processed: ProcessedTransaction[] = history.map((tx: TransactionHistoryItem) => {
        const balanceValue = typeof tx.balance === 'bigint' ? Number(tx.balance) : tx.balance;
        const type = balanceValue >= 0 ? 'received' : 'sent'
        const amount = Math.abs(balanceValue)

        return {
          id: tx.tx_id,
          type,
          amount,
          timestamp: new Date(tx.timestamp * 1000).toISOString(),
          txHash: tx.tx_id,
          status: !tx.is_voided ? 'confirmed' : 'pending'
        }
      })
      if (isInitialLoad) {
        setTransactions(processed);
        setCurrentCount(processed.length);
      } else {
        setTransactions(prev => [...prev, ...processed]);
        setCurrentCount(prev => prev + processed.length);
      }

      // Notify context of page change
      setHistoryDialogState(true, pageNum);
    } catch (error) {
      console.error('Failed to load transaction history:', error)
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }

  const handleLoadMore = () => {
    loadTransactionHistory(currentCount);
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const openExplorer = (txHash: string) => {
    const baseUrl = network === NETWORKS.MAINNET
      ? HATHOR_EXPLORER_URLS.MAINNET
      : HATHOR_EXPLORER_URLS.TESTNET
    window.open(`${baseUrl}/transaction/${txHash}`, '_blank')
  }

  const handleUnregisterToken = async () => {
    if (!selectedToken || selectedToken.uid === TOKEN_IDS.HTR) return;

    await unregisterToken(selectedToken.uid);
    // Close the history dialog after unregistering
    onClose();
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <Header onRegisterTokenClick={onRegisterTokenClick} />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-16 py-12">
        {/* Back Button */}
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-white hover:text-primary transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to home</span>
        </button>

        {/* Title */}
        <div className="flex items-start justify-between mb-12">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-medium text-white">
              Transaction History
            </h1>
            {selectedToken && (
              <p className="text-sm text-muted-foreground mt-2">
                {selectedToken.symbol} - {selectedToken.name}
              </p>
            )}
          </div>
          {/* Unregister token link - only show for custom tokens */}
          {selectedToken && selectedToken.uid !== TOKEN_IDS.HTR && (
            <button
              onClick={() => setUnregisterDialogOpen(true)}
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors underline"
            >
              Unregister token
            </button>
          )}
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-sm text-muted-foreground">Loading transaction history...</p>
            </div>
          ) : transactions.length > 0 ? (
            <>
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-[#191C21] border border-[#24292F] rounded-xl p-6 flex items-center justify-between hover:bg-[#191C21]/80 transition-colors"
                >
                  {/* Left: Icon + Info */}
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      tx.type === 'received'
                        ? 'bg-green-500/20'
                        : 'bg-red-500/20'
                    }`}>
                      {tx.type === 'received' ? (
                        <ArrowDownLeft className="h-5 w-5 text-green-500" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white capitalize">
                        {tx.type} Token
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(tx.timestamp)}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount + Explorer Link */}
                  <div className="flex items-center gap-4">
                    <p className={`text-xl font-medium ${
                      tx.type === 'received' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {tx.type === 'received' ? '+' : '-'}{formatHTRAmount(tx.amount)}
                      <span className="text-sm ml-2">{selectedToken?.symbol || 'HTR'}</span>
                    </p>
                    <button
                      onClick={() => openExplorer(tx.txHash)}
                      className="p-2 hover:bg-secondary/20 rounded-lg transition-colors"
                    >
                      <ExternalLink className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>
              ))}

              {/* See More Button */}
              {hasMore && (
                <div className="flex justify-center pt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-8 py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'See more'
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No transactions yet</p>
              <p className="text-xs mt-1">Your transaction history will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Unregister Token Dialog */}
      {selectedToken && selectedToken.uid !== TOKEN_IDS.HTR && (
        <UnregisterTokenDialog
          isOpen={unregisterDialogOpen}
          onClose={() => setUnregisterDialogOpen(false)}
          onConfirm={handleUnregisterToken}
          tokenSymbol={selectedToken.symbol}
          tokenName={selectedToken.name}
        />
      )}
    </div>
  )
}

export default HistoryDialog