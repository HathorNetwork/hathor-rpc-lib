import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Loader2, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { useWallet } from '../contexts/WalletContext';
import { useTokens } from '../hooks/useTokens';
import { formatAmount, amountToCents, centsToAmount } from '../utils/hathor';
import { dateToUnixTimestamp, isFutureDate, getTimezoneOffset } from '../utils/timelock';
import { Address, Network } from '@hathor/wallet-lib';
import { TOKEN_IDS } from '../constants';
import { readOnlyWalletWrapper } from '../services/ReadOnlyWalletWrapper';
import { getAddressForMode } from '../utils/addressMode';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface SendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialTokenUid?: string;
}

// Create a Zod schema factory for form validation
// Note: Balance validation is done separately in useEffect to handle dynamic token changes
const createSendFormSchema = (network: string) =>
  z.object({
    selectedToken: z.string(),
    amount: z
      .string()
      .min(1, 'Amount is required')
      .refine((val) => {
        // Basic format validation - allows both whole numbers and decimals
        return /^\d+(\.\d{1,2})?$/.test(val);
      }, 'Invalid amount format. Use up to 2 decimal places.')
      .refine((val) => {
        try {
          const amountInCents = amountToCents(val);
          return amountInCents > 0n;
        } catch {
          return false;
        }
      }, 'Amount must be greater than 0'),
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
    timelock: z.date().optional().refine(
      (date) => !date || isFutureDate(date),
      'Timelock date must be in the future'
    ),
    dataOutput: z.string().optional(),
  });

type SendFormData = z.infer<ReturnType<typeof createSendFormSchema>>;

const SendDialog: React.FC<SendDialogProps> = ({ isOpen, onClose, initialTokenUid }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [timeHour, setTimeHour] = useState<string>('12');
  const [timeMinute, setTimeMinute] = useState<string>('00');
  const [timePeriod, setTimePeriod] = useState<'AM' | 'PM'>('PM');

  const { sendTransaction, network, refreshBalance, addressMode } = useWallet();
  const { allTokens } = useTokens();

  // Initialize form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    trigger,
    setError,
    clearErrors,
  } = useForm<SendFormData>({
    resolver: zodResolver(createSendFormSchema(network)),
    defaultValues: {
      selectedToken: initialTokenUid || TOKEN_IDS.HTR,
      amount: '',
      address: '',
      timelock: undefined,
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
        timelock: undefined,
        dataOutput: '',
      });
      // Also reset UI state
      setSelectedDate(undefined);
      setTimeHour('12');
      setTimeMinute('00');
      setTimePeriod('PM');
    }
  }, [isOpen, initialTokenUid, reset]);

  const amount = watch('amount');
  const selectedTokenUid = watch('selectedToken');

  // Get the selected token's balance
  const selectedToken = React.useMemo(() => {
    return allTokens.find(t => t.uid === selectedTokenUid);
  }, [allTokens, selectedTokenUid]);

  const availableBalance = selectedToken?.balance?.available || 0n;

  // Validate amount: NFT format and balance check
  // This runs separately from Zod schema to handle dynamic token changes
  React.useEffect(() => {
    if (!amount) return;

    // First check NFT format
    if (selectedToken?.isNFT && amount.includes('.')) {
      setError('amount', {
        type: 'manual',
        message: 'NFT amounts must be whole numbers only.',
      });
      return;
    }

    // Then check balance
    try {
      const amountInBaseUnits = selectedToken?.isNFT
        ? BigInt(amount)
        : amountToCents(amount);

      if (amountInBaseUnits > availableBalance) {
        setError('amount', {
          type: 'manual',
          message: 'Insufficient balance',
        });
        return;
      }
    } catch {
      // amountToCents will throw for invalid formats, let Zod handle that
      return;
    }

    // Clear manual errors and re-trigger Zod validation
    clearErrors('amount');
    trigger('amount');
  }, [amount, selectedToken?.isNFT, availableBalance, setError, clearErrors, trigger]);

  const handleMaxClick = () => {
    if (availableBalance > 0n) {
      // NFTs are already in whole units, no conversion needed
      // Regular tokens need to be converted from base units (cents) to display units
      const maxAmount = selectedToken?.isNFT
        ? availableBalance.toString()
        : centsToAmount(availableBalance);
      setValue('amount', maxAmount, {
        shouldValidate: true
      });
    }
  };

  const onSubmit = async (data: SendFormData) => {
    console.log('[SendDialog] onSubmit called with data:', data);
    setIsLoading(true);
    setTransactionError(null);

    try {
      // For NFTs, amount is already in base units (whole numbers)
      // For regular tokens, convert from display units to base units (cents)
      const amountInBaseUnits = selectedToken?.isNFT
        ? BigInt(data.amount)
        : amountToCents(data.amount);
      console.log('[SendDialog] Amount in base units:', amountInBaseUnits.toString());

      // Final balance check to ensure we have sufficient funds
      // This prevents race conditions where balance changed after form validation
      if (amountInBaseUnits > availableBalance) {
        const shortfall = amountInBaseUnits - availableBalance;
        const displayAmount = selectedToken?.isNFT
          ? amountInBaseUnits.toString()
          : centsToAmount(amountInBaseUnits);
        const displayAvailable = selectedToken?.isNFT
          ? availableBalance.toString()
          : centsToAmount(availableBalance);
        const displayShortfall = selectedToken?.isNFT
          ? shortfall.toString()
          : centsToAmount(shortfall);

        setTransactionError(
          `Insufficient balance. You need ${displayAmount} ${selectedToken?.symbol} ` +
          `but only have ${displayAvailable} ${selectedToken?.symbol} available. ` +
          `Short by ${displayShortfall} ${selectedToken?.symbol}.`
        );
        setIsLoading(false);
        return;
      }

      // Get change address based on address mode
      console.log('[SendDialog] Getting change address for address mode:', addressMode);
      const changeAddress = await getAddressForMode(addressMode, readOnlyWalletWrapper);
      console.log('[SendDialog] Change address:', changeAddress);

      // Prepare output with optional timelock
      const output: {
        address: string;
        value: string;
        token: string;
        timelock?: number;
      } = {
        address: data.address.trim(),
        value: amountInBaseUnits.toString(),
        token: data.selectedToken
      };

      // Add timelock if provided (convert Date to Unix timestamp)
      if (data.timelock) {
        output.timelock = dateToUnixTimestamp(data.timelock);
        console.log('[SendDialog] Timelock added:', {
          date: data.timelock,
          timestamp: output.timelock,
          formatted: new Date(output.timelock * 1000).toLocaleString()
        });
      } else {
        console.log('[SendDialog] No timelock specified');
      }

      console.log('[SendDialog] Final output object:', output);
      console.log('[SendDialog] Calling sendTransaction...');

      const result = await sendTransaction({
        network,
        outputs: [output],
        changeAddress,
      });

      console.log('[SendDialog] Transaction result:', result);

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
                placeholder={selectedToken?.isNFT ? '0' : '0.0'}
                inputMode={selectedToken?.isNFT ? 'numeric' : 'decimal'}
                pattern={selectedToken?.isNFT ? '[0-9]*' : undefined}
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
                Balance available: {formatAmount(availableBalance, selectedToken?.isNFT || false)} {selectedToken?.symbol || 'HTR'}
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
            <div className="flex flex-col gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <span className="text-red-400 text-sm whitespace-pre-line">{transactionError}</span>
              {transactionError.includes('permission') && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.location.reload();
                  }}
                  className="text-xs text-primary hover:text-primary/80 underline self-start"
                >
                  Click here to refresh and reconnect
                </button>
              )}
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
                    <span className="ml-2 text-xs text-muted-foreground">
                      {getTimezoneOffset()}
                    </span>
                  </label>
                  <div className="space-y-2">
                    {/* Date selection */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="w-full px-3 py-2 bg-[#0D1117] border border-border rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-primary flex items-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        {selectedDate ? selectedDate.toLocaleDateString() : 'Select date'}
                      </button>
                      {showDatePicker && (
                        <div className="absolute top-full left-0 mt-2 z-50 bg-[#0D1117] border border-border rounded-lg p-4 shadow-xl">
                          <style>{`
                            .rdp {
                              --rdp-accent-color: #7c3aed;
                              --rdp-background-color: #7c3aed;
                            }
                            .rdp-day_button {
                              color: white;
                            }
                            .rdp-day_button:hover:not([disabled]) {
                              background-color: rgba(124, 58, 237, 0.2);
                            }
                            .rdp-day_selected .rdp-day_button {
                              background-color: #7c3aed;
                              color: white;
                            }
                            .rdp-day_disabled {
                              opacity: 0.3;
                            }
                            .rdp-nav_button {
                              color: white !important;
                            }
                            .rdp-nav_button svg {
                              fill: white !important;
                              stroke: white !important;
                              color: white !important;
                            }
                            .rdp-chevron {
                              fill: white !important;
                              stroke: white !important;
                            }
                            .rdp-caption_label {
                              color: white;
                              font-weight: 500;
                            }
                            .rdp-weekday {
                              color: #9ca3af;
                            }
                          `}</style>
                          <DayPicker
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              setSelectedDate(date);
                              setShowDatePicker(false);
                              if (date) {
                                // Combine date and time into a single Date object
                                const hour24 = timePeriod === 'PM' && timeHour !== '12'
                                  ? parseInt(timeHour) + 12
                                  : timePeriod === 'AM' && timeHour === '12'
                                  ? 0
                                  : parseInt(timeHour);
                                const combinedDate = new Date(date);
                                combinedDate.setHours(hour24, parseInt(timeMinute), 0, 0);
                                setValue('timelock', combinedDate, { shouldValidate: true });
                              }
                            }}
                            disabled={{ before: new Date() }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Time selection */}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={timeHour}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 12)) {
                            setTimeHour(val);
                            // Update form value if date is selected
                            if (selectedDate) {
                              const hour24 = timePeriod === 'PM' && val !== '12'
                                ? parseInt(val) + 12
                                : timePeriod === 'AM' && val === '12'
                                ? 0
                                : parseInt(val);
                              const combinedDate = new Date(selectedDate);
                              combinedDate.setHours(hour24, parseInt(timeMinute), 0, 0);
                              setValue('timelock', combinedDate, { shouldValidate: true });
                            }
                          }
                        }}
                        className="w-16 px-2 py-2 bg-[#0D1117] border border-border rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <span className="text-white">:</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={timeMinute}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                            setTimeMinute(val.padStart(2, '0'));
                            // Update form value if date is selected
                            if (selectedDate) {
                              const hour24 = timePeriod === 'PM' && timeHour !== '12'
                                ? parseInt(timeHour) + 12
                                : timePeriod === 'AM' && timeHour === '12'
                                ? 0
                                : parseInt(timeHour);
                              const combinedDate = new Date(selectedDate);
                              combinedDate.setHours(hour24, parseInt(val), 0, 0);
                              setValue('timelock', combinedDate, { shouldValidate: true });
                            }
                          }
                        }}
                        className="w-16 px-2 py-2 bg-[#0D1117] border border-border rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <select
                        value={timePeriod}
                        onChange={(e) => {
                          const period = e.target.value as 'AM' | 'PM';
                          setTimePeriod(period);
                          // Update form value if date is selected
                          if (selectedDate) {
                            const hour24 = period === 'PM' && timeHour !== '12'
                              ? parseInt(timeHour) + 12
                              : period === 'AM' && timeHour === '12'
                              ? 0
                              : parseInt(timeHour);
                            const combinedDate = new Date(selectedDate);
                            combinedDate.setHours(hour24, parseInt(timeMinute), 0, 0);
                            setValue('timelock', combinedDate, { shouldValidate: true });
                          }
                        }}
                        className="px-3 py-2 bg-[#0D1117] border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                      {selectedDate && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate(undefined);
                            setValue('timelock', undefined);
                          }}
                          className="ml-2 px-2 py-1 text-xs text-red-400 hover:text-red-300"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  {errors.timelock && (
                    <p className="mt-1 text-sm text-red-400">{errors.timelock.message}</p>
                  )}
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
