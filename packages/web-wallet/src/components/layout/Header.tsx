import { useState } from 'react'
import { t } from 'ttag'
import { Copy } from 'lucide-react'
import Icon from '../common/Icon'

export default function Header() {
  const [isCopied, setIsCopied] = useState(false)
  const address = '937hkw...dfp472'

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(address)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <header className="border-b border-card-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/hathor_logo.svg" alt="Hathor" className="h-7" />
            <span className="text-sm text-text-secondary uppercase tracking-wider">{t`Web Wallet`}</span>
          </div>
          
          <button
            onClick={handleCopyAddress}
            className="flex items-center space-x-2 bg-card px-4 py-2 rounded-lg hover:bg-card-border transition-colors"
          >
            <span className="text-sm text-text-secondary">
              {isCopied ? t`Copied!` : address}
            </span>
            <Icon icon={Copy} size="sm" className="text-text-secondary" />
          </button>
        </div>
      </div>
    </header>
  )
}