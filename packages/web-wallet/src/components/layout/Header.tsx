import { useState } from 'react'

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
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-white">hathor</h1>
            <span className="text-sm text-text-secondary uppercase tracking-wider">Web Wallet</span>
          </div>
          
          <button
            onClick={handleCopyAddress}
            className="flex items-center space-x-2 bg-card px-4 py-2 rounded-lg hover:bg-card-border transition-colors"
          >
            <span className="text-sm text-text-secondary">
              {isCopied ? 'Copied!' : address}
            </span>
            <svg
              className="w-4 h-4 text-text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}