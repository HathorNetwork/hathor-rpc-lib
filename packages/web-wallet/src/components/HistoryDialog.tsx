import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Clock, ArrowUpRight, ArrowDownLeft, ExternalLink, Loader2 } from 'lucide-react'
import { useWallet } from '../contexts/WalletContext'
import { formatHTRAmount, truncateAddress } from '../utils/hathor'
import { HATHOR_EXPLORER_URLS, NETWORKS } from '../constants'

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
  const { address, network, getTransactionHistory } = useWallet()

  useEffect(() => {
    if (isOpen && address) {
      loadTransactionHistory()
    }
  }, [isOpen, address])

  const loadTransactionHistory = async () => {
    if (!address) return

    setIsLoading(true)
    try {
      const history = await getTransactionHistory(50, 0, '00')

      // Process transactions from wallet-lib format
      const processed: ProcessedTransaction[] = history.map((tx) => {
        // balance is positive for received, negative for sent
        const type = tx.balance >= 0 ? 'received' : 'sent'
        const amount = Math.abs(tx.balance)

        return {
          id: tx.tx_id,
          type,
          amount,
          timestamp: new Date(tx.timestamp * 1000).toISOString(), // wallet-lib timestamp is in seconds
          txHash: tx.tx_id,
          status: !tx.is_voided ? 'confirmed' : 'pending'
        }
      })

      // Sort by timestamp, newest first (already sorted from wallet-lib)
      setTransactions(processed)
    } catch (error) {
      console.error('Failed to load transaction history:', error)
    } finally {
      setIsLoading(false)
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[709px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Transaction History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-sm text-muted-foreground">Loading transaction history...</p>
            </div>
          ) : transactions.length > 0 ? (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    tx.type === 'received' 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-red-500/20 text-red-500'
                  }`}>
                    {tx.type === 'received' ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm capitalize">
                      {tx.type} HTR
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.timestamp)}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {truncateAddress(tx.txHash)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right flex items-center gap-2">
                  <div>
                    <p className={`font-medium ${
                      tx.type === 'received' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {tx.type === 'received' ? '+' : '-'}{formatHTRAmount(tx.amount)} HTR
                    </p>
                    <p className={`text-xs ${
                      tx.status === 'confirmed' 
                        ? 'text-green-500' 
                        : 'text-yellow-500'
                    }`}>
                      {tx.status}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openExplorer(tx.txHash)}
                    className="h-8 w-8"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No transactions yet</p>
              <p className="text-xs mt-1">Your transaction history will appear here</p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border">
          <Button
            onClick={onClose}
            className="w-full"
            variant="outline"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default HistoryDialog