import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Modal from '../common/Modal'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import { useWalletStore } from '../../store/walletStore'
import { formatNumber } from '../../utils/formatters'

interface SendFormData {
  tokenId: string
  amount: string
  address: string
}

interface SendTokensModalProps {
  onClose: () => void
}

export default function SendTokensModal({ onClose }: SendTokensModalProps) {
  const tokens = useWalletStore((state) => state.tokens)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SendFormData>({
    defaultValues: {
      tokenId: 'htr',
      amount: '',
      address: '',
    },
  })

  const selectedTokenId = watch('tokenId')
  const selectedToken = tokens.find((t) => t.id === selectedTokenId)
  const amount = watch('amount')

  const onSubmit = async (data: SendFormData) => {
    setIsSending(true)
    // Simulate sending
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsSending(false)
    setIsSuccess(true)
    
    // Close modal after success
    setTimeout(() => {
      onClose()
    }, 1500)
  }

  const validateAmount = (value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue <= 0) {
      return 'Amount must be greater than 0'
    }
    if (selectedToken && numValue > selectedToken.balance) {
      return 'Balance insufficient'
    }
    return true
  }

  const validateAddress = (value: string) => {
    if (!value || value.length < 10) {
      return 'This field is invalid'
    }
    return true
  }

  return (
    <Modal isOpen onClose={onClose}>
      <div className="p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Send Tokens</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Select
            label="Select Token"
            {...register('tokenId')}
          >
            {tokens.map((token) => (
              <option key={token.id} value={token.id}>
                {token.symbol}
              </option>
            ))}
          </Select>

          <div>
            <Input
              label="Amount"
              type="number"
              step="0.01"
              placeholder="0.0"
              suffix={selectedToken?.symbol}
              error={errors.amount?.message}
              {...register('amount', { validate: validateAmount })}
            />
            {selectedToken && (
              <p className="text-xs text-text-secondary mt-1">
                BALANCE AVAILABLE: {formatNumber(selectedToken.balance)} {selectedToken.symbol}
              </p>
            )}
          </div>

          <Input
            label="Destination Address"
            placeholder="Address"
            error={errors.address?.message}
            {...register('address', { validate: validateAddress })}
          />

          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="flex items-center space-x-2 text-text-secondary hover:text-white transition-colors"
          >
            <span>Advanced options</span>
            <svg
              className={`w-4 h-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isAdvancedOpen && (
            <div className="p-4 bg-background rounded-lg">
              <p className="text-sm text-text-secondary">
                Advanced options will be available in future versions
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSending || isSuccess}
          >
            {isSuccess ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Transaction sent</span>
              </>
            ) : isSending ? (
              <span>Sending...</span>
            ) : (
              <span>Send token</span>
            )}
          </Button>
        </form>
      </div>
    </Modal>
  )
}