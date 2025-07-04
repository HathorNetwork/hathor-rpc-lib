import { useState } from 'react'
import { t } from 'ttag'
import { ArrowUp, ArrowDown } from 'lucide-react'
import BalanceCard from '../components/home/BalanceCard'
import AssetsList from '../components/home/AssetsList'
import Button from '../components/common/Button'
import Icon from '../components/common/Icon'
import SendTokensModal from '../components/modals/SendTokensModal'
import ReceiveTokensModal from '../components/modals/ReceiveTokensModal'

export default function Home() {
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false)

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-8">
        <BalanceCard />

        <div className="flex items-center gap-4">
          <Button
            onClick={() => setIsSendModalOpen(true)}
            className="w-1/3 relative justify-start h-24"
            size="lg"
          >
            <Icon icon={ArrowUp} className="mr-3" />
            {t`Send`}
          </Button>

          <Button
            onClick={() => setIsReceiveModalOpen(true)}
            className="w-1/3 relative justify-start h-24"
            size="lg"
          >
            <Icon icon={ArrowDown} className="mr-3" />
            {t`Receive`}
          </Button>

          <Button
            variant="disabled"
            disabled
            className="w-1/3 relative justify-start h-24"
            size="lg"
          >
            {t`Create Token`}
          </Button>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-4">{t`My Assets`}</h2>
          <AssetsList
            onReceiveClick={() => setIsReceiveModalOpen(true)}
            onSendClick={() => setIsSendModalOpen(true)}
          />
        </div>
      </div>

      {isSendModalOpen && (
        <SendTokensModal onClose={() => setIsSendModalOpen(false)} />
      )}

      {isReceiveModalOpen && (
        <ReceiveTokensModal onClose={() => setIsReceiveModalOpen(false)} />
      )}
    </>
  )
}
