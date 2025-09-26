import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUpRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface SendTokenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SendTokenDialog: React.FC<SendTokenDialogProps> = ({ open, onOpenChange }) => {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  // Mock balance - replace with actual balance
  const balance = 1234.56

  const handleSend = async () => {
    // Validation
    if (!recipient) {
      setError('Please enter a recipient address')
      return
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (parseFloat(amount) > balance) {
      setError('Insufficient balance')
      return
    }

    setError('')
    setSending(true)
    
    // Simulate sending transaction
    setTimeout(() => {
      setSending(false)
      setSent(true)
      setTimeout(() => {
        // Reset and close after success
        setSent(false)
        setRecipient('')
        setAmount('')
        onOpenChange(false)
      }, 2000)
    }, 2000)
  }

  const handleClose = () => {
    if (!sending) {
      setRecipient('')
      setAmount('')
      setError('')
      setSent(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[648px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display flex items-center gap-2">
            <ArrowUpRight className="h-6 w-6 text-primary" />
            Send HTR
          </DialogTitle>
        </DialogHeader>

        {!sent ? (
          <div className="space-y-6 pt-4">
            {/* Balance Display */}
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
              <p className="text-2xl font-display">{balance.toFixed(2)} HTR</p>
            </div>

            {/* Recipient Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Recipient Address
              </label>
              <Input
                placeholder="Enter recipient address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="bg-secondary/50 border-input"
                disabled={sending}
              />
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Amount
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-secondary/50 border-input pr-16"
                  disabled={sending}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  HTR
                </span>
              </div>
              {amount && parseFloat(amount) > balance && (
                <p className="text-xs text-destructive">Insufficient balance</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={sending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                className="flex-1"
                disabled={sending || !recipient || !amount || parseFloat(amount) > balance}
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-medium">Transaction Sent!</h3>
            <p className="text-sm text-muted-foreground">
              Your transaction has been successfully submitted
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default SendTokenDialog