import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWallet } from '../contexts/WalletContext';
import { formatHTRAmount, htrToCents, centsToHTR } from '../utils/hathor';
import { Network } from '@hathor/wallet-lib';
import Address from '@hathor/wallet-lib/lib/models/address';
import { TOKEN_IDS, HTR_DECIMAL_MULTIPLIER } from '../constants';

interface SendDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Create a Zod schema factory for form validation
const createSendFormSchema = (availableBalance: bigint, network: string) =>
  z.object({
    selectedToken: z.string(),
    amount: z
      .string()
      .min(1, 'Amount is required')
      .regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format. Use up to 2 decimal places.')
      .refine((val) => {
        try {
          const amountInCents = htrToCents(val);
          return amountInCents > 0n;
        } catch {
          return false;
        }
      }, 'Amount must be greater than 0')
      .refine((val) => {
        try {
          const amountInCents = htrToCents(val);
          return amountInCents <= availableBalance;
        } catch {
          return false;
        }
      }, 'Insufficient balance'),
    address: z
      .string()
      .min(1, 'Address is required')
      .superRefine((val, ctx) => {
        try {
          const networkObj = new Network(network);
          const addressObj = new Address(val.trim(), { network: networkObj });
          addressObj.validateAddress();
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Invalid address';
          let customMessage = 'Invalid Hathor address format';

          if (errorMsg.includes('checksum')) {
            customMessage = 'Invalid address checksum. Please check the address.';
          } else if (errorMsg.includes('network')) {
            customMessage = `Invalid address for ${network} network`;
          }

          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: customMessage,
          });
        }
      }),
    timelock: z.string().optional(),
    dataOutput: z.string().optional(),
  });

type SendFormData = z.infer<ReturnType<typeof createSendFormSchema>>;

const SendDialog: React.FC<SendDialogProps> = ({ isOpen, onClose }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const { sendTransaction, balances, network, refreshBalance } = useWallet();

  const availableBalance = balances.length > 0 ? balances[0].available : 0n;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<SendFormData>({
    resolver: zodResolver(createSendFormSchema(availableBalance, network)),
    defaultValues: {
      selectedToken: 'HTR',
      amount: '',
      address: '',
      timelock: '',
      dataOutput: '',
    },
    mode: 'onChange',
  });

  const amount = watch('amount');

  const handleMaxClick = () => {
    if (availableBalance > 0n) {
      setValue('amount', centsToHTR(availableBalance), {
        shouldValidate: true
      });
    }
  };

  const onSubmit = async (data: SendFormData) => {
    setIsLoading(true);
    setTransactionError(null);

    try {
      const amountInCents = htrToCents(data.amount);

      const result = await sendTransaction({
        network,
        outputs: [{
          address: data.address.trim(),
          value: amountInCents.toString(),
          token: TOKEN_IDS.HTR
        }]
      });

      console.log('Transaction sent successfully:', result);

      // Refresh balance after successful transaction
      await refreshBalance();

      // Reset form and close
      reset();
      setTransactionError(null);
      onClose();
    } catch (err) {
      console.error('Failed to send transaction:', err);
      setTransactionError(err instanceof Error ? err.message : 'Failed to send transaction');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#191C21] border border-[#24292F] rounded-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="relative flex items-center justify-center p-6">
          <h2 className="text-base font-bold text-primary-400">Send Tokens</h2>
          <button
            onClick={onClose}
            className="absolute right-6 p-1 hover:bg-secondary/20 rounded transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Select Token */}
          <div>
            <label className="block text-base font-bold text-white mb-2">
              Select Token
            </label>
            <select
              {...register('selectedToken')}
              className="w-full px-3 py-2 bg-[#0D1117] border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
              <option value="HTR">HTR</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-base font-bold text-white mb-2">
              Amount
            </label>
            <div className="relative">
              <input
                type="text"
                {...register('amount')}
                placeholder="0.0"
                className={`w-full px-3 py-2 pr-12 bg-[#0D1117] border ${
                  errors.amount ? 'border-red-500' : 'border-border'
                } rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
              />
              <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">HTR</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground uppercase">
                Balance available: {formatHTRAmount(availableBalance)} HTR
              </span>
              <button
                type="button"
                onClick={handleMaxClick}
                className="text-xs text-primary hover:text-primary/80 transition-colors uppercase"
              >
                Max
              </button>
            </div>
            {errors.amount && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-red-400">{errors.amount.message}</span>
              </div>
            )}
          </div>

          {/* Destination Address */}
          <div>
            <label className="block text-base font-bold text-white mb-2">
              Destination Address
            </label>
            <input
              type="text"
              {...register('address')}
              placeholder="Address"
              className={`w-full px-3 py-2 bg-[#0D1117] border ${
                errors.address ? 'border-red-500' : 'border-border'
              } rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
            />
            {errors.address && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-red-400">{errors.address.message}</span>
              </div>
            )}
          </div>

          {transactionError && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <span className="text-red-400 text-sm">{transactionError}</span>
            </div>
          )}

          {/* Advanced Options */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-base font-bold text-white hover:text-primary transition-colors"
            >
              Advanced options
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4">
                {/* Timelock */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Timelock (optional)
                  </label>
                  <input
                    type="text"
                    {...register('timelock')}
                    placeholder="MM / DD / YYYY"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Data Output */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Data output (optional)
                  </label>
                  <textarea
                    {...register('dataOutput')}
                    placeholder="Optional message or metadata"
                    rows={3}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={isLoading || !amount}
            className="w-auto mx-auto px-8 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending transaction
              </>
            ) : (
              'Send token'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SendDialog;
