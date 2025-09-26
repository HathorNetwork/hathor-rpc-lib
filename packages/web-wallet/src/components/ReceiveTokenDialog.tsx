import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ArrowDownLeft, Copy, Check, QrCode } from 'lucide-react'

interface ReceiveTokenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  address: string
}

const ReceiveTokenDialog: React.FC<ReceiveTokenDialogProps> = ({ 
  open, 
  onOpenChange, 
  address 
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[532px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display flex items-center gap-2">
            <ArrowDownLeft className="h-6 w-6 text-primary" />
            Receive HTR
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* QR Code Placeholder */}
          <div className="bg-white rounded-lg p-8 mx-auto w-fit">
            <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
              <QrCode className="h-32 w-32 text-gray-400" />
            </div>
          </div>

          {/* Address Display */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Your Wallet Address
            </label>
            <div className="bg-secondary/50 rounded-lg p-4 flex items-center justify-between">
              <p className="text-sm font-mono text-white break-all pr-2">
                {address}
              </p>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Info Text */}
          <div className="bg-primary/10 rounded-lg p-4">
            <p className="text-sm text-center text-muted-foreground">
              Share this address to receive HTR tokens
            </p>
          </div>

          {/* Action Button */}
          <Button
            onClick={() => onOpenChange(false)}
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

export default ReceiveTokenDialog