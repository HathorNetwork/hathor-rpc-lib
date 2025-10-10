import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, ArrowDownLeft, Clock, Copy, Check } from 'lucide-react'
import SendTokenDialog from './SendTokenDialog'
import ReceiveTokenDialog from './ReceiveTokenDialog'
import HistoryDialog from './HistoryDialog'

const WalletHome: React.FC = () => {
  const [sendOpen, setSendOpen] = useState(false)
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Mock data - replace with actual wallet data
  const balance = "1,234.56"
  const address = "HJKj8Ks9d8f7sdf8s7df8s7df8s7df8s7df"
  const hasBalance = true

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-card border-border">
        <CardContent className="p-8 space-y-8">
          {/* Logo and Title */}
          <div className="text-center space-y-2">
            <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-primary">H</span>
            </div>
            <h1 className="text-5xl font-display font-normal text-white">
              {balance} HTR
            </h1>
            <p className="text-muted-foreground text-sm">Hathor Network</p>
          </div>

          {/* Address Section */}
          <div className="bg-secondary/50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Your Address</p>
              <p className="text-sm font-mono text-white truncate">{address}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyAddress}
              className="ml-2"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-4">
            <Button
              onClick={() => setSendOpen(true)}
              className="flex flex-col gap-2 h-auto py-4"
              variant="secondary"
              disabled={!hasBalance}
            >
              <ArrowUpRight className="h-5 w-5" />
              <span>Send</span>
            </Button>
            <Button
              onClick={() => setReceiveOpen(true)}
              className="flex flex-col gap-2 h-auto py-4"
              variant="secondary"
            >
              <ArrowDownLeft className="h-5 w-5" />
              <span>Receive</span>
            </Button>
            <Button
              onClick={() => setHistoryOpen(true)}
              className="flex flex-col gap-2 h-auto py-4"
              variant="secondary"
              disabled={!hasBalance}
            >
              <Clock className="h-5 w-5" />
              <span>History</span>
            </Button>
          </div>

          {/* Recent Transactions Preview */}
          {hasBalance && (
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">Recent Activity</h3>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setHistoryOpen(true)}
                  className="text-primary h-auto p-0"
                >
                  View all
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Sent</span>
                  </div>
                  <span className="text-sm font-medium">-50.00 HTR</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Received</span>
                  </div>
                  <span className="text-sm font-medium">+100.00 HTR</span>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!hasBalance && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No transactions yet</p>
              <p className="text-xs mt-1">Receive HTR to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <SendTokenDialog open={sendOpen} onOpenChange={setSendOpen} />
      <ReceiveTokenDialog 
        open={receiveOpen} 
        onOpenChange={setReceiveOpen} 
        address={address} 
      />
      <HistoryDialog isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  )
}

export default WalletHome