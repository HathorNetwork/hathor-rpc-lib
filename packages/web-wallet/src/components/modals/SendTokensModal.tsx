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
  timelock?: string
  dataOutput?: string
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
      <div className="p-10">
        <h2 className="text-xl font-semibold text-primary mb-8 text-center">Send Tokens</h2>
        
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
              <p className="text-xs text-text-muted mt-2 uppercase">
                Balance Available: {formatNumber(selectedToken.balance)} {selectedToken.symbol}
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
            className="flex items-center justify-between w-full text-white font-medium"
          >
            <span>Advanced options</span>
            <svg
              className={`w-5 h-5 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`}
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
            <div className="space-y-6 pt-6">
              <div>
                <label className="text-base font-medium text-white block mb-3">
                  Timelock (optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="MM / DD / YYYY"
                    className="w-full bg-background border border-card-border rounded-lg px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-200"
                    {...register('timelock')}
                  />
                  <svg
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <label className="text-base font-medium text-white block mb-3">
                  Data output (optional)
                </label>
                <textarea
                  placeholder="Optional message or metadata"
                  rows={3}
                  className="w-full bg-background border border-card-border rounded-lg px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-200 resize-none"
                  {...register('dataOutput')}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-8 bg-[#4A4A5A] text-text-muted py-3 rounded-xl font-medium hover:bg-[#5A5A6A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSending || isSuccess}
          >
            {isSuccess ? (
              <>
                <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Transaction sent
              </>
            ) : isSending ? (
              'Sending...'
            ) : (
              'Send token'
            )}
          </button>
        </form>
      </div>
    </Modal>
  )
}