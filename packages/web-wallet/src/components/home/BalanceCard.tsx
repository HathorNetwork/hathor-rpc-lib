import { useWalletStore } from '../../store/walletStore'
import { formatNumber } from '../../utils/formatters'

export default function BalanceCard() {
  const totalBalance = useWalletStore((state) => state.totalBalance)

  return (
    <div className="bg-card border border-card-border rounded-2xl p-8">
      <div className="flex items-center space-x-4">
        <img src="/hathor_icon.svg" alt="Hathor" className="w-12 h-12" />
        <div className="flex-1">
          <p className="text-sm text-text-secondary uppercase tracking-wider">Total Balance</p>
          <p className="text-3xl font-bold text-white">{formatNumber(totalBalance)} HTR</p>
        </div>
      </div>
    </div>
  )
}