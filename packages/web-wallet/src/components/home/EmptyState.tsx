import { t } from 'ttag'
import { Wallet } from 'lucide-react'
import Button from '../common/Button'
import Icon from '../common/Icon'

interface EmptyStateProps {
  onReceiveClick: () => void
}

export default function EmptyState({ onReceiveClick }: EmptyStateProps) {
  return (
    <div className="bg-card border border-card-border rounded-2xl p-12 text-center">
      <div className="w-24 h-24 bg-orange-500/20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
        <Icon icon={Wallet} size="xl" className="text-orange-500" />
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2">{t`No tokens yet.`}</h3>
      <p className="text-text-secondary mb-8">
        {t`Your wallet is empty.`}<br />
        {t`Start by receiving HTR to view your balance and make transactions.`}
      </p>
      
      <Button onClick={onReceiveClick}>
        {t`Receive tokens`}
      </Button>
    </div>
  )
}