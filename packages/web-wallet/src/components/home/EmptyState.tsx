import Button from '../common/Button'

interface EmptyStateProps {
  onReceiveClick: () => void
}

export default function EmptyState({ onReceiveClick }: EmptyStateProps) {
  return (
    <div className="bg-card border border-card-border rounded-2xl p-12 text-center">
      <div className="w-24 h-24 bg-orange-500/20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
        <svg
          className="w-12 h-12 text-orange-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M20 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4Z" />
          <path d="M22 6L12 13L2 6" stroke="#1a1b23" strokeWidth="2" />
        </svg>
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2">No tokens yet.</h3>
      <p className="text-text-secondary mb-8">
        Your wallet is empty.<br />
        Start by receiving HTR to view your balance and make transactions.
      </p>
      
      <Button onClick={onReceiveClick}>
        Receive tokens
      </Button>
    </div>
  )
}