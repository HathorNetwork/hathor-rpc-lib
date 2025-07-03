import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { useWalletStore } from '../../store/walletStore'

interface ReceiveTokensModalProps {
  onClose: () => void
}

export default function ReceiveTokensModal({ onClose }: ReceiveTokensModalProps) {
  const address = useWalletStore((state) => state.address)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    QRCode.toDataURL(address, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    }).then(setQrCodeUrl)
  }, [address])

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(address)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <Modal isOpen onClose={onClose}>
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Receive Tokens</h2>
        <p className="text-text-secondary mb-8">
          Send HTR or custom tokens to this address.
        </p>
        
        <div className="bg-white p-4 rounded-xl inline-block mb-6">
          {qrCodeUrl && (
            <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
          )}
        </div>
        
        <div className="bg-background rounded-lg p-4 mb-6">
          <p className="text-sm text-white font-mono break-all">{address}</p>
        </div>
        
        <Button onClick={handleCopyAddress} className="w-full">
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
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
            />
          </svg>
          <span>{isCopied ? 'Copied!' : 'Copy address'}</span>
        </Button>
      </div>
    </Modal>
  )
}