import { useWalletStore } from '../../store/walletStore'
import { formatNumber } from '../../utils/formatters'

export default function BalanceCard() {
  const totalBalance = useWalletStore((state) => state.totalBalance)

  return (
    <div className="bg-card border border-card-border rounded-2xl p-8">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
          <svg
            className="w-6 h-6 text-primary"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2L2 7V17C2 17.5304 2.21071 18.0391 2.58579 18.4142C2.96086 18.7893 3.46957 19 4 19H20C20.5304 19 21.0391 18.7893 21.4142 18.4142C21.7893 18.0391 22 17.5304 22 17V7L12 2Z" />
            <path d="M22 7L12 12L2 7" stroke="#1a1b23" strokeWidth="2" />
            <path d="M12 22V12" stroke="#1a1b23" strokeWidth="2" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm text-text-secondary uppercase tracking-wider">Total Balance</p>
          <p className="text-3xl font-bold text-white">{formatNumber(totalBalance)} HTR</p>
        </div>
      </div>
    </div>
  )
}