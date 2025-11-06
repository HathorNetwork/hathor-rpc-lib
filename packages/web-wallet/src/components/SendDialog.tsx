import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWallet } from '../contexts/WalletContext';
import { useTokens } from '../hooks/useTokens';
import { formatHTRAmount, htrToCents, centsToHTR } from '../utils/hathor';
import { Network } from '@hathor/wallet-lib';
import Address from '@hathor/wallet-lib/lib/models/address';
import { TOKEN_IDS, HTR_DECIMAL_MULTIPLIER } from '../constants';
import { readOnlyWalletService } from '../services/ReadOnlyWalletService';
import { getAddressForMode } from '../utils/addressMode';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface SendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialTokenUid?: string;
}

// Create a Zod schema factory for form validation
const createSendFormSchema = (availableBalance: number, network: string) =>
  z.object({
    selectedToken: z.string(),
    amount: z
      .string()
      .min(1, 'Amount is required')
      .regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format. Use up to 2 decimal places.')
      .refine((val) => {
        const num = parseFloat(val);
        return num > 0;
      }, 'Amount must be greater than 0')
      .refine((val) => {
        const num = parseFloat(val);
        return num <= Number.MAX_SAFE_INTEGER / HTR_DECIMAL_MULTIPLIER;
      }, 'Amount is too large')
      .refine((val) => {
        const amountInCents = htrToCents(val);
        return amountInCents <= availableBalance;
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

const SendDialog: React.FC<SendDialogProps> = ({ isOpen, onClose, initialTokenUid }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const { sendTransaction, network, refreshBalance, addressMode } = useWallet();
  const { allTokens } = useTokens();

  // Get initial token balance for form setup
  const initialBalance = allTokens.length > 0 ? allTokens[0].balance.available : 0;

  // Initialize form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    trigger,
  } = useForm<SendFormData>({
    resolver: zodResolver(createSendFormSchema(initialBalance, network)),
    defaultValues: {
      selectedToken: initialTokenUid || TOKEN_IDS.HTR,
      amount: '',
      address: '',
      timelock: '',
      dataOutput: '',
    },
    mode: 'onChange',
  });

  // Reset form with selected token when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      reset({
        selectedToken: initialTokenUid || TOKEN_IDS.HTR,
        amount: '',
        address: '',
        timelock: '',
        dataOutput: '',
      });
    }
  }, [isOpen, initialTokenUid, reset]);

  const amount = watch('amount');
  const selectedTokenUid = watch('selectedToken');

  // Get the selected token's balance
  const selectedToken = React.useMemo(() => {
    return allTokens.find(t => t.uid === selectedTokenUid);
  }, [allTokens, selectedTokenUid]);

  const availableBalance = selectedToken?.balance.available || 0;

  // Re-validate amount when token or balance changes to use current balance
  React.useEffect(() => {
    if (amount) {
      trigger('amount');
    }
  }, [selectedTokenUid, availableBalance, amount, trigger]);

  const handleMaxClick = () => {
    if (availableBalance > 0) {
      setValue('amount', centsToHTR(availableBalance).toString(), {
        shouldValidate: true
      });
    }
  };

  const onSubmit = async (data: SendFormData) => {
    setIsLoading(true);
    setTransactionError(null);

    try {
      const amountInCents = htrToCents(data.amount);

      // Final balance check to ensure we have sufficient funds
      // This prevents race conditions where balance changed after form validation
      if (amountInCents > availableBalance) {
        setTransactionError('Insufficient balance for this transaction');
        setIsLoading(false);
        return;
      }

      // Get change address based on address mode
      const changeAddress = await getAddressForMode(addressMode, readOnlyWalletService);

      const result = await sendTransaction({
        network,
        outputs: [{
          address: data.address.trim(),
          value: amountInCents.toString(),
          token: data.selectedToken
        }],
        changeAddress,
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
    <div className="fixed inset-0 bg-black/50 flex items-start md:items-center justify-center z-50 overflow-y-auto p-4 md:p-0">
      <div className="bg-[#191C21] border border-[#24292F] rounded-2xl w-full max-w-md my-4 md:my-0 md:mx-4">
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
            <Select
              key={isOpen ? selectedTokenUid : 'closed'}
              value={selectedTokenUid}
              onValueChange={(value) => setValue('selectedToken', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a token..." />
              </SelectTrigger>
              <SelectContent>
                {allTokens.map((token) => (
                  <SelectItem key={token.uid} value={token.uid}>
                    {token.symbol} - {token.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                {selectedToken?.symbol || 'HTR'}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground uppercase">
                Balance available: {formatHTRAmount(availableBalance)} {selectedToken?.symbol || 'HTR'}
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
