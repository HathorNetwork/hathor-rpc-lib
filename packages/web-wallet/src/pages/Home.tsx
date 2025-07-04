import { useState } from 'react'
import BalanceCard from '../components/home/BalanceCard'
import AssetsList from '../components/home/AssetsList'
import Button from '../components/common/Button'
import Tooltip from '../components/common/Tooltip'
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
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 11l5-5m0 0l5 5m-5-5v12"
              />
            </svg>
            Send
          </Button>

          <Button
            onClick={() => setIsReceiveModalOpen(true)}
            className="w-1/3 relative justify-start h-24"
            size="lg"
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 13l-5 5m0 0l-5-5m5 5V6"
              />
            </svg>
            Receive
          </Button>

          <Button
            variant="disabled"
            disabled
            className="w-1/3 relative justify-start h-24"
            size="lg"
          >
            Create Token
          </Button>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-4">My Assets</h2>
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
