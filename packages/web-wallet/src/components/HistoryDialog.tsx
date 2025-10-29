import React, { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownLeft, ExternalLink, Loader2, ArrowLeft, Clock } from 'lucide-react'
import { useWallet } from '../contexts/WalletContext'
import { formatHTRAmount } from '../utils/hathor'
import { HATHOR_EXPLORER_URLS, NETWORKS, TOKEN_IDS } from '../constants'
import Header from './Header'

interface HistoryDialogProps {
  isOpen: boolean
  onClose: () => void
}

interface ProcessedTransaction {
  id: string
  type: 'sent' | 'received'
  amount: number
  timestamp: string
  txHash: string
  status: 'confirmed' | 'pending'
}

const HistoryDialog: React.FC<HistoryDialogProps> = ({ isOpen, onClose }) => {
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentCount, setCurrentCount] = useState(0)
  const PAGE_SIZE = 10
  const { address, network, getTransactionHistory } = useWallet()

  useEffect(() => {
    if (isOpen && address) {
      // Reset pagination when dialog opens
      setTransactions([])
      setCurrentCount(0)
      setHasMore(true)
      loadTransactionHistory(0)
    }
  }, [isOpen, address])

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

    try {
      const history = await getTransactionHistory(PAGE_SIZE, skip, TOKEN_IDS.HTR)

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

      const processed: ProcessedTransaction[] = history.map((tx: any) => {
        const balanceValue = typeof tx.balance === 'bigint' ? Number(tx.balance) : tx.balance;
        const type = balanceValue >= 0 ? 'received' : 'sent'
        const amount = Math.abs(balanceValue)

        return {
          id: tx.txId || tx.tx_id,
          type,
          amount,
          timestamp: new Date(tx.timestamp * 1000).toISOString(),
          txHash: tx.txId || tx.tx_id,
          status: !tx.voided && !tx.is_voided ? 'confirmed' : 'pending'
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <Header />

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
        <h1 className="text-3xl font-medium text-white text-center mb-12">
          Transaction History
        </h1>

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
                      <span className="text-sm ml-2">HTR</span>
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
    </div>
  )
}

export default HistoryDialog