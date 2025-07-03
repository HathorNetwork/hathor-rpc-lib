import { useWalletStore } from '../../store/walletStore'
import { formatNumber } from '../../utils/formatters'
import EmptyState from './EmptyState'

interface AssetsListProps {
  onReceiveClick: () => void
  onSendClick: () => void
}

export default function AssetsList({ onReceiveClick, onSendClick }: AssetsListProps) {
  const tokens = useWalletStore((state) => state.tokens)
  const hasTokens = tokens.some(token => token.balance > 0)

  if (!hasTokens) {
    return <EmptyState onReceiveClick={onReceiveClick} />
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
      <div className="divide-y divide-card-border">
        {tokens.filter(token => token.balance > 0).map((token) => (
          <div key={token.id} className="p-6 hover:bg-card-border/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">
                    {token.symbol.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{token.symbol}</h3>
                  <p className="text-sm text-text-secondary">{token.name}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-white">{formatNumber(token.balance)}</p>
                <p className="text-sm text-text-secondary">
                  ${formatNumber(token.balance * (token.price || 0))}
                </p>
              </div>
              
              <button
                onClick={onSendClick}
                className="ml-4 text-text-secondary hover:text-white transition-colors"
              >
                <span className="text-sm">Send</span>
                <svg
                  className="w-4 h-4 inline-block ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}