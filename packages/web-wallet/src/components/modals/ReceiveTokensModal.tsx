import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { t } from 'ttag'
import { Copy } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Icon from '../common/Icon'
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
        <h2 className="text-2xl font-bold text-primary mb-2">{t`Receive Tokens`}</h2>
        <p className="text-text-secondary mb-8">
          {t`Send HTR or custom tokens to this address.`}
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
          <Icon icon={Copy} />
          <span>{isCopied ? t`Copied!` : t`Copy address`}</span>
        </Button>
      </div>
    </Modal>
  )
}