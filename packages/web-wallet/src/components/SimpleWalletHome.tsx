import React, { useState } from 'react'

const SimpleWalletHome: React.FC = () => {
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
      <div className="card w-full max-w-2xl">
        <div className="p-8 space-y-8">
          {/* Logo and Title */}
          <div className="text-center space-y-2">
            <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-primary">H</span>
            </div>
            <h1 className="text-5xl font-display text-white">
              {balance} HTR
            </h1>
            <p className="text-muted-foreground text-sm">Hathor Network</p>
          </div>

          {/* Address Section */}
          <div className="bg-secondary/50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Your Address</p>
              <p className="text-sm font-mono text-white truncate pr-2">{address}</p>
            </div>
            <button
              className="btn btn-ghost"
              onClick={handleCopyAddress}
            >
              {copied ? (
                <span className="text-green-500">✓</span>
              ) : (
                <span>📋</span>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-4">
            <button
              className="btn btn-secondary flex-col h-auto py-4"
              disabled={!hasBalance}
            >
              <span className="text-lg mb-2">↗</span>
              <span>Send</span>
            </button>
            <button
              className="btn btn-secondary flex-col h-auto py-4"
            >
              <span className="text-lg mb-2">↙</span>
              <span>Receive</span>
            </button>
            <button
              className="btn btn-secondary flex-col h-auto py-4"
              disabled={!hasBalance}
            >
              <span className="text-lg mb-2">🕒</span>
              <span>History</span>
            </button>
          </div>

          {/* Recent Transactions Preview */}
          {hasBalance && (
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">Recent Activity</h3>
                <button className="text-primary text-sm">
                  View all
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">↗</span>
                    <span className="text-sm">Sent</span>
                  </div>
                  <span className="text-sm font-medium">-50.00 HTR</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">↙</span>
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
        </div>
      </div>
    </div>
  )
}

export default SimpleWalletHome