import React, { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownLeft, ExternalLink, Loader2, ArrowLeft, Clock, Copy } from 'lucide-react'
import { useWallet } from '../contexts/WalletContext'
import { useTokens } from '../hooks/useTokens'
import type { TransactionHistoryItem } from '../types/wallet'
import { formatAmount, toBigInt, truncateString } from '../utils/hathor'
import { HATHOR_EXPLORER_URLS, NETWORKS, TOKEN_IDS } from '../constants'
import Header from './Header'
import UnregisterTokenDialog from './UnregisterTokenDialog'
import { useToast } from '@/hooks/use-toast'

/**
 * Full-screen dialog displaying transaction history for a specific token.
 * Shows token details (name, symbol, balance, UID), paginated transaction list,
 * and provides actions like viewing on explorer and unregistering custom tokens.
 * Supports real-time updates via WebSocket for incoming transactions.
 */
interface HistoryDialogProps {
  isOpen: boolean
  onClose: () => void
  tokenUid?: string
  onRegisterTokenClick?: () => void
}

interface ProcessedTransaction {
  id: string
  type: 'sent' | 'received'
  amount: bigint
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
  const { address, network, getTransactionHistory, newTransaction, clearNewTransaction } = useWallet()
  const { allTokens } = useTokens()
  const { toast } = useToast()

  // Get token info for display
  const selectedToken = React.useMemo(() => {
    const uid = tokenUid || TOKEN_IDS.HTR;
    return allTokens.find(t => t.uid === uid);
  }, [allTokens, tokenUid]);

  useEffect(() => {
    if (isOpen && address) {
      // Reset pagination when dialog opens
      setTransactions([])
      setCurrentCount(0)
      setHasMore(true)
      loadTransactionHistory(0)
    } else if (!isOpen) {
      // Dialog is closed
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
      const balanceValue = toBigInt(transaction.balance as number | bigint);
      const type = balanceValue >= 0n ? 'received' : 'sent'
      const amount = balanceValue >= 0n ? balanceValue : -balanceValue

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
        const balanceValue = toBigInt(tx.balance);
        const type = balanceValue >= 0n ? 'received' : 'sent'
        const amount = balanceValue >= 0n ? balanceValue : -balanceValue

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

  const openTokenDetails = () => {
    if (!selectedToken) return;
    const baseUrl = network === NETWORKS.MAINNET
      ? HATHOR_EXPLORER_URLS.MAINNET
      : HATHOR_EXPLORER_URLS.TESTNET
    window.open(`${baseUrl}/token_detail/${selectedToken.uid}`, '_blank')
  }

  const copyTokenUid = async () => {
    if (!selectedToken) return;
    try {
      await navigator.clipboard.writeText(selectedToken.uid);
      toast({
        variant: "success",
        title: "Copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy token UID:', error);
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <Header onRegisterTokenClick={onRegisterTokenClick} />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-16 py-6 md:py-12">
        {/* Back Button and Actions */}
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-white hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to home</span>
          </button>

          <div className="flex items-center gap-4">
            {selectedToken && selectedToken.uid !== TOKEN_IDS.HTR && (
              <button
                onClick={() => setUnregisterDialogOpen(true)}
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                Unregister token
              </button>
            )}
            {selectedToken && (
              <button
                onClick={openTokenDetails}
                className="px-4 py-2 bg-[#191C21] border border-border hover:bg-[#24292F] text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                <span>View on explorer</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Token Info Card */}
        {selectedToken && (
          <div className="bg-[#191C21] border border-[#24292F] rounded-lg p-6 mb-6">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Token */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Token</p>
                <p className="text-base font-medium text-white">{selectedToken.name} ({selectedToken.symbol})</p>
              </div>

              {/* Right Column: Available Balance + Locked Balance */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Available balance</p>
                <p className="text-base font-medium text-white">
                  {selectedToken.balance ? formatAmount(selectedToken.balance.available, selectedToken.isNFT) : '0'} {selectedToken.symbol}
                </p>
                {/* Locked Balance (Only if > 0) - Small secondary line */}
                {selectedToken.balance && selectedToken.balance.locked > 0n && (
                  <p className="text-xs text-[#6B7280] mt-1">
                    {formatAmount(selectedToken.balance.locked, selectedToken.isNFT)} locked
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Section: Token UID */}
            {selectedToken.uid !== TOKEN_IDS.HTR && (
              <div className="mt-6 pt-6 border-t border-[#24292F]">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Token UID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-[#6B7280] font-mono">{truncateString(selectedToken.uid, 16, 16)}</p>
                    <button
                      onClick={copyTokenUid}
                      className="p-1.5 rounded transition-colors group"
                      title="Copy token UID"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transactions List */}
        <div className="bg-[#191C21] border border-[#24292F] rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-sm text-muted-foreground">Loading transaction history...</p>
            </div>
          ) : transactions.length > 0 ? (
            <>
              {transactions.map((tx, index) => (
                <div
                  key={tx.id}
                  className={`p-4 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-[#24292F]/50 transition-colors ${
                    index !== transactions.length - 1 ? 'border-b border-[#24292F]' : ''
                  }`}
                >
                  {/* Left: Icon + Info */}
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      tx.type === 'received'
                        ? 'bg-green-500/20'
                        : 'bg-red-500/20'
                    }`}>
                      {tx.type === 'received' ? (
                        <ArrowDownLeft className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white capitalize text-sm md:text-base">
                        {tx.type} Token
                      </p>
                      <p className="text-xs md:text-sm text-[#6B7280] truncate">
                        {formatDate(tx.timestamp)}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount + Explorer Link */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 md:gap-4 flex-shrink-0">
                    <p className={`text-lg md:text-xl font-medium ${
                      tx.type === 'received' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {tx.type === 'received' ? '+' : '-'}{formatAmount(tx.amount, selectedToken?.isNFT || false)}
                      <span className="text-xs md:text-sm ml-1 md:ml-2">{selectedToken?.symbol || 'HTR'}</span>
                    </p>
                    <button
                      onClick={() => openExplorer(tx.txHash)}
                      className="p-2 hover:bg-secondary/20 rounded-lg transition-colors flex-shrink-0"
                    >
                      <ExternalLink className="h-4 w-4 md:h-5 md:w-5 text-white" />
                    </button>
                  </div>
                </div>
              ))}

              {/* See More Button */}
              {hasMore && (
                <div className="flex justify-center p-6 border-t border-[#24292F]">
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
          onClose={() => {
            setUnregisterDialogOpen(false);
            onClose();
          }}
          onSuccess={() => {
            toast({
              variant: "success",
              title: "Token unregistered successfully!",
            });
          }}
          tokenUid={selectedToken.uid}
          tokenSymbol={selectedToken.symbol}
          tokenName={selectedToken.name}
        />
      )}
    </div>
  )
}

export default HistoryDialog
