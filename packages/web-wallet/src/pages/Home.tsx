import { useState } from 'react'
import BalanceCard from '../components/home/BalanceCard'
import AssetsList from '../components/home/AssetsList'
import Button from '../components/common/Button'
import SendTokensModal from '../components/modals/SendTokensModal'
import ReceiveTokensModal from '../components/modals/ReceiveTokensModal'

export default function Home() {
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false)

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-8">
        <BalanceCard />
        
        <div className="flex items-center justify-center space-x-4">
          <Button onClick={() => setIsSendModalOpen(true)}>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 11l5-5m0 0l5 5m-5-5v12"
              />
            </svg>
            <span>Send</span>
          </Button>
          
          <Button onClick={() => setIsReceiveModalOpen(true)}>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 13l-5 5m0 0l-5-5m5 5V6"
              />
            </svg>
            <span>Receive</span>
          </Button>
          
          <Button variant="secondary" disabled>
            <span>Create Token</span>
            <span className="ml-2 text-xs bg-card-border px-2 py-1 rounded-full">
              Available in future version
            </span>
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