import React, { useState, useMemo } from 'react';
import { X, Loader2, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWallet } from '../contexts/WalletContext';
import { useFeatureToggle } from '../contexts/FeatureToggleContext';
import { useInvokeSnap } from '@hathor/snap-utils';
import { helpersUtils, tokensUtils, constants, TokenVersion } from '@hathor/wallet-lib';
import { formatAmount, amountToCents } from '../utils/hathor';
import { readOnlyWalletWrapper } from '../services/ReadOnlyWalletWrapper';
import { getAddressForMode } from '../utils/addressMode';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '@/hooks/use-toast';
import { Info } from 'lucide-react';

interface CreateTokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Zod schema for token creation form
const createTokenSchema = z.object({
  name: z
    .string()
    .min(1, 'Token name is required')
    .max(30, 'Token name must be 30 characters or less'),
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(5, 'Symbol must be 5 characters or less'),
  amount: z.string().min(1, 'Amount is required'),
  tokenType: z.enum(['deposit', 'fee']),
  isNFT: z.boolean(),
  nftData: z.string().max(150, 'NFT data must be 150 characters or less').optional(),
  createMintAuthority: z.boolean().optional(),
  createMeltAuthority: z.boolean().optional(),
}).superRefine((data, ctx) => {
  // Validate amount based on token type
  if (data.isNFT) {
    // NFTs: must be whole numbers
    if (!/^\d+$/.test(data.amount)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'NFT amount must be a whole number',
        path: ['amount'],
      });
      return;
    }
    try {
      const num = BigInt(data.amount);
      if (num <= 0n) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Amount must be greater than 0',
          path: ['amount'],
        });
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid amount',
        path: ['amount'],
      });
    }
  } else {
    // Regular tokens: allow up to 2 decimal places
    if (!/^\d+(\.\d{1,2})?$/.test(data.amount)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid amount format. Use up to 2 decimal places.',
        path: ['amount'],
      });
      return;
    }
    try {
      const amountInCents = amountToCents(data.amount);
      if (amountInCents <= 0n) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Amount must be greater than 0',
          path: ['amount'],
        });
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Amount must be greater than 0',
        path: ['amount'],
      });
    }
  }
});

type CreateTokenFormData = z.infer<typeof createTokenSchema>;

const CreateTokenDialog: React.FC<CreateTokenDialogProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    configString: string;
    tokenName: string;
    tokenSymbol: string;
  } | null>(null);

  const { registerToken, balances, addressMode } = useWallet();
  const { isFeeTokensEnabled } = useFeatureToggle();
  const invokeSnap = useInvokeSnap();
  const { toast } = useToast();

  // Get HTR balance
  const htrBalance = balances.get(constants.NATIVE_TOKEN_UID)?.available ?? 0n;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CreateTokenFormData>({
    resolver: zodResolver(createTokenSchema),
    defaultValues: {
      name: '',
      symbol: '',
      amount: '',
      tokenType: 'deposit',
      isNFT: false,
      nftData: '',
      createMintAuthority: false,
      createMeltAuthority: false,
    },
    mode: 'onChange',
  });

  const isNFT = watch('isNFT');
  const amount = watch('amount');
  const tokenType = watch('tokenType');

  // Determine if this is a fee-based token (no deposit required)
  const isFeeBasedToken = isFeeTokensEnabled && tokenType === 'fee' && !isNFT;

  // Calculate 1% HTR deposit (1 HTR per 100 tokens)
  // For every 100 tokens, 1 HTR (100 cents) deposit is required
  // Formula: (tokens / 100) * 100 cents = tokens * 1 cent
  // Fee-based tokens don't require a deposit
  const depositInCents = useMemo(() => {
    try {
      if (!amount || amount === '0') return 0n;

      // Fee-based tokens don't require a deposit
      if (isFeeBasedToken) return 0n;

      let amountInBaseUnits: bigint;
      if (isNFT) {
        // NFTs: whole numbers only, 1 NFT = 0.01 HTR (1 base unit)
        const amountBigInt = BigInt(amount);
        if (amountBigInt <= 0n) return 0n;
        amountInBaseUnits = amountBigInt;
      } else {
        // Regular tokens: support decimals, use amountToCents for conversion
        amountInBaseUnits = amountToCents(amount);
        if (amountInBaseUnits <= 0n) return 0n;
      }

      return tokensUtils.getDepositAmount(amountInBaseUnits);
    } catch {
      return 0n;
    }
  }, [amount, isNFT, isFeeBasedToken]);

  // Check if user has insufficient balance
  const hasInsufficientBalance = useMemo(() => {
    return depositInCents > htrBalance;
  }, [depositInCents, htrBalance]);

  const onSubmit = async (data: CreateTokenFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Determine if this is a fee-based token creation
      const isCreatingFeeToken = isFeeTokensEnabled && data.tokenType === 'fee' && !data.isNFT;

      // Derive mint/melt settings
      // For NFTs: use the checkbox values
      // For regular tokens: use the checkbox values
      const createMint = data.createMintAuthority || false;
      const createMelt = data.createMeltAuthority || false;

      // Get addresses based on address mode
      const changeAddress = await getAddressForMode(addressMode, readOnlyWalletWrapper);
      const mintAddress = await getAddressForMode(addressMode, readOnlyWalletWrapper);

      // Convert amount to base units for the RPC
      // For NFTs: 1 NFT = 0.01 HTR (1 base unit), so don't multiply
      // For regular tokens: convert with decimals using amountToCents
      const amountInBaseUnits = data.isNFT
        ? BigInt(data.amount)
        : amountToCents(data.amount);

      // Prepare RPC params
      const params = {
        name: data.name,
        symbol: data.symbol,
        amount: String(amountInBaseUnits),
        change_address: changeAddress,
        create_mint: createMint,
        create_melt: createMelt,
        mint_authority_address: null, // Leave as null for wallet-managed
        melt_authority_address: null, // Leave as null for wallet-managed
        allow_external_mint_authority_address: false,
        allow_external_melt_authority_address: false,
        data: data.isNFT && data.nftData ? [data.nftData] : null,
        address: mintAddress, // Mint address where tokens are sent
        ...(isCreatingFeeToken && { token_version: TokenVersion.FEE }),
      };

      // Call RPC
      const result = await invokeSnap({
        method: 'htr_createToken',
        params,
      });

      // Parse response with proper error handling
      let parsedResponse;
      try {
        parsedResponse = typeof result === 'string' ? JSON.parse(result) : result;
      } catch {
        console.error('Failed to parse token creation response:', result);
        throw new Error('Received invalid response from snap. Please try again.');
      }

      const transaction = parsedResponse?.response;
      if (!transaction || typeof transaction !== 'object') {
        console.error('Invalid transaction structure:', parsedResponse);
        throw new Error('Token creation response missing transaction data');
      }

      // Extract token UID from transaction
      // The token UID is the transaction hash for the first created token
      if (!transaction.hash || typeof transaction.hash !== 'string') {
        console.error('Invalid transaction hash:', transaction);
        throw new Error('Token creation succeeded but transaction ID is missing');
      }
      const tokenUid = transaction.hash;

      // Generate config string: [name:symbol:uid:checksum]
      const partialConfig = `${data.name}:${data.symbol}:${tokenUid}`;
      const checksumBuffer = helpersUtils.getChecksum(Buffer.from(partialConfig));
      const checksum = checksumBuffer.toString('hex');
      const configString = `[${partialConfig}:${checksum}]`;

      // Auto-register token
      await registerToken(configString);

      // Show success state
      setSuccessData({
        configString,
        tokenName: data.name,
        tokenSymbol: data.symbol,
      });
    } catch (err) {
      console.error('Failed to create token:', err);

      // User-friendly error messages
      const errorMsg = err instanceof Error ? err.message : 'Failed to create token';

      if (errorMsg.includes('rejected') || errorMsg.includes('User rejected')) {
        setError('Transaction was cancelled. Please try again.');
      } else if (errorMsg.includes('insufficient') || errorMsg.includes('Insufficient')) {
        setError('Insufficient HTR balance for deposit and fees.');
      } else if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
        setError('Request timed out. Please check your connection and try again.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyConfig = async () => {
    if (successData?.configString) {
      try {
        await navigator.clipboard.writeText(successData.configString);
        toast({
          variant: "success",
          title: "Configuration copied to clipboard",
        });
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      setError(null);
      setSuccessData(null);
      onClose();
    }
  };

  const handleSuccessClose = () => {
    setSuccessData(null);
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start md:items-center justify-center z-50 overflow-y-auto p-4 md:p-0">
      <div className="bg-[#191C21] border border-[#24292F] rounded-2xl w-full max-w-lg my-4 md:my-0 md:mx-4">
        {successData ? (
          // Success State
          <>
            {/* Header */}
            <div className="relative flex items-center justify-center p-6 border-b border-[#24292F]">
              <h2 className="text-base font-bold text-primary-400">Token Created</h2>
              <button
                onClick={handleSuccessClose}
                className="absolute right-6 p-1 hover:bg-secondary/20 rounded transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Success Content */}
            <div className="p-6 space-y-6">
              {/* Success Message */}
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-base font-bold text-white">
                    Your token {successData.tokenSymbol} has been successfully created!
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You can share the following configuration string with other people to let them use your brand new token.
                  </p>
                </div>
              </div>

              {/* Reminder */}
              <div className="bg-[#0D1117] border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Remember to <span className="text-white font-medium">make a backup</span> of this configuration string.
                </p>
              </div>

              {/* Config String */}
              <div className="bg-[#0D1117] border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-mono break-all">
                    {successData.configString}
                  </span>
                  <button
                    onClick={handleCopyConfig}
                    className="ml-2 p-1 hover:bg-secondary/20 rounded transition-colors flex-shrink-0"
                    title="Copy configuration string"
                  >
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleSuccessClose}
                className="w-full px-8 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium"
              >
                Ok
              </button>
            </div>
          </>
        ) : (
          // Form State
          <>
            {/* Header */}
            <div className="relative flex items-center justify-center p-4 md:p-6 border-b border-[#24292F]">
              <h2 className="text-base md:text-lg font-bold text-primary-400">Create Token</h2>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="absolute right-6 p-1 hover:bg-secondary/20 rounded transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Name Input */}
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                <label className="text-sm md:text-base font-bold text-white md:w-[120px]">Name</label>
                <div className="flex-1">
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="MyCoin"
                    className={`w-full px-4 py-3 bg-[#0D1117] border ${
                      errors.name ? 'border-red-500' : 'border-border'
                    } rounded-lg text-white placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary`}
                  />
                  {errors.name && (
                    <div className="flex items-start gap-2 mt-2">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-red-400">{errors.name.message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Symbol Input */}
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                <label className="text-sm md:text-base font-bold text-white md:w-[120px]">Symbol</label>
                <div className="flex-1">
                  <input
                    type="text"
                    {...register('symbol')}
                    placeholder="MYC (2-5 characters)"
                    className={`w-full px-4 py-3 bg-[#0D1117] border ${
                      errors.symbol ? 'border-red-500' : 'border-border'
                    } rounded-lg text-white placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary`}
                  />
                  {errors.symbol && (
                    <div className="flex items-start gap-2 mt-2">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-red-400">{errors.symbol.message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Amount Input and NFT Toggle */}
              <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-6">
                <label className="text-sm md:text-base font-bold text-white md:w-[120px] md:pt-3">Amount</label>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-2">
                    <input
                      type="text"
                      {...register('amount')}
                      placeholder={isNFT ? "Enter quantity (e.g., 5)" : "1"}
                      className={`w-full sm:flex-1 px-4 py-3 bg-[#0D1117] border ${
                        errors.amount ? 'border-red-500' : 'border-border'
                      } rounded-lg text-white placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary`}
                    />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-sm md:text-base font-bold text-white whitespace-nowrap">Create as NFT</span>
                      <div className="relative inline-block w-11 h-6">
                        <input
                          type="checkbox"
                          {...register('isNFT')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[#0D1117] border border-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </div>
                    </label>
                  </div>
                  {errors.amount && (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-red-400">{errors.amount.message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* NFT Data Field - Only shown for NFTs */}
              {isNFT && (
                <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-6">
                  <label className="text-sm md:text-base font-bold text-white md:w-[120px] md:pt-3">NFT Data</label>
                  <div className="flex-1">
                    <input
                      type="text"
                      {...register('nftData')}
                      placeholder="ipfs://..."
                      className={`w-full px-4 py-3 bg-[#0D1117] border ${
                        errors.nftData ? 'border-red-500' : 'border-border'
                      } rounded-lg text-white placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary`}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      String that uniquely identify your NFT. For example, the IPFS link to your metadata file, a URI to your asset or any string. Max size: 150 characters.
                    </p>
                    {errors.nftData && (
                      <div className="flex items-start gap-2 mt-2">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-red-400">{errors.nftData.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mint/Melt Authority Checkboxes */}
              <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-6">
                <div className="md:w-[120px]"></div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Create a mint authority */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      {...register('createMintAuthority')}
                      className="sr-only"
                    />
                    <div className="relative flex-shrink-0 mt-0.5 w-5 h-5 border-2 border-border rounded bg-[#0D1117] group-has-[:checked]:bg-primary group-has-[:checked]:border-primary transition-all flex items-center justify-center">
                      <svg className="w-3 h-3 text-white opacity-0 group-has-[:checked]:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm text-white font-medium block">Create a mint authority</span>
                      <span className="text-xs text-muted-foreground block mt-1">
                        If you want to be able to mint more units of this token.
                      </span>
                    </div>
                  </label>

                  {/* Create a melt authority */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      {...register('createMeltAuthority')}
                      className="sr-only"
                    />
                    <div className="relative flex-shrink-0 mt-0.5 w-5 h-5 border-2 border-border rounded bg-[#0D1117] group-has-[:checked]:bg-primary group-has-[:checked]:border-primary transition-all flex items-center justify-center">
                      <svg className="w-3 h-3 text-white opacity-0 group-has-[:checked]:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm text-white font-medium block">Create a melt authority</span>
                      <span className="text-xs text-muted-foreground block mt-1">
                        If you want to be able to melt units of this token.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Token Type dropdown - only shown when fee tokens feature is enabled */}
              {isFeeTokensEnabled && !isNFT && (
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                <div className="flex items-center gap-2 md:w-[120px]">
                  <label className="text-sm md:text-base font-bold text-white">Token Type</label>
                  <div className="group relative">
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-80 p-3 bg-[#0D1117] border border-border rounded-lg text-xs text-white z-10">
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          <strong>Deposit Token:</strong> 1% HTR deposit required. No transfer fees.
                        </li>
                        <li>
                          <strong>Fee Token:</strong> No deposit required. Small fee for each transfer.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <Select
                    value={tokenType}
                    onValueChange={(value) => setValue('tokenType', value as 'deposit' | 'fee')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="fee">Fee</SelectItem>
                    </SelectContent>
                  </Select>
                  <ul className="list-disc list-inside text-xs text-muted-foreground mt-2 space-y-1">
                    <li>
                      <strong>Deposit Token:</strong> 1% HTR deposit required. No transfer fees.
                    </li>
                    <li>
                      <strong>Fee Token:</strong> No deposit required. Small fee for each transfer.
                    </li>
                  </ul>
                </div>
              </div>
              )}

              {/* Deposit Display */}
              {amount && parseFloat(amount) > 0 && (
                <div className="space-y-1">
                  {isFeeBasedToken ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        <span className="uppercase tracking-wide font-medium">DEPOSIT:</span> No deposit required
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fee-based tokens charge 1 HTR per transaction output instead of requiring an upfront deposit.
                      </p>
                    </>
                  ) : depositInCents > 0n && (
                    <>
                      <p className="text-sm text-muted-foreground">
                        <span className="uppercase tracking-wide font-medium">DEPOSIT:</span> {formatAmount(depositInCents, false)} HTR
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="uppercase tracking-wide font-medium">TOTAL:</span> {formatAmount(depositInCents, false)} HTR ({formatAmount(htrBalance, false)} HTR AVAILABLE)
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Insufficient Balance Warning - only for deposit-based tokens */}
              {hasInsufficientBalance && !isFeeBasedToken && amount && parseFloat(amount) > 0 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-yellow-400 text-sm">
                    Insufficient HTR balance. You need {formatAmount(depositInCents, false)} HTR but only have {formatAmount(htrBalance, false)} HTR available.
                  </span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              {/* Create Button */}
              <button
                type="submit"
                disabled={isLoading || !amount || (hasInsufficientBalance && !isFeeBasedToken)}
                className="w-full px-8 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating token
                  </>
                ) : (
                  'Create Token'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateTokenDialog;
