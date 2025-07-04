import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { t } from 'ttag'
import { ChevronDown, Calendar, Check } from 'lucide-react'
import Modal from '../common/Modal'
import Input from '../common/Input'
import Select from '../common/Select'
import Icon from '../common/Icon'
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

  const onSubmit = async (_data: SendFormData) => {
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
      return t`Amount must be greater than 0`
    }
    if (selectedToken && numValue > selectedToken.balance) {
      return t`Balance insufficient`
    }
    return true
  }

  const validateAddress = (value: string) => {
    if (!value || value.length < 10) {
      return t`This field is invalid`
    }
    return true
  }

  return (
    <Modal isOpen onClose={onClose}>
      <div className="p-10">
        <h2 className="text-xl font-semibold text-primary mb-8 text-center">{t`Send Tokens`}</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Select
            label={t`Select Token`}
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
              label={t`Amount`}
              type="number"
              step="0.01"
              placeholder="0.0"
              suffix={selectedToken?.symbol}
              error={errors.amount?.message}
              {...register('amount', { validate: validateAmount })}
            />
            {selectedToken && (
              <p className="text-xs text-text-muted mt-2 uppercase">
                {t`Balance Available:`} {formatNumber(selectedToken.balance)} {selectedToken.symbol}
              </p>
            )}
          </div>

          <Input
            label={t`Destination Address`}
            placeholder={t`Address`}
            error={errors.address?.message}
            {...register('address', { validate: validateAddress })}
          />

          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="flex items-center justify-between w-full text-white font-medium"
          >
            <span>{t`Advanced options`}</span>
            <Icon 
              icon={ChevronDown} 
              className={`transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          {isAdvancedOpen && (
            <div className="space-y-6 pt-6">
              <div>
                <label className="text-base font-medium text-white block mb-3">
                  {t`Timelock (optional)`}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t`MM / DD / YYYY`}
                    className="w-full bg-background border border-card-border rounded-lg px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-200"
                    {...register('timelock')}
                  />
                  <Icon 
                    icon={Calendar} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" 
                  />
                </div>
              </div>

              <div>
                <label className="text-base font-medium text-white block mb-3">
                  {t`Data output (optional)`}
                </label>
                <textarea
                  placeholder={t`Optional message or metadata`}
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
                <Icon icon={Check} className="inline mr-2" />
                {t`Transaction sent`}
              </>
            ) : isSending ? (
              t`Sending...`
            ) : (
              t`Send token`
            )}
          </button>
        </form>
      </div>
    </Modal>
  )
}