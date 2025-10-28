import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { formatHTRAmount, htrToCents, centsToHTR } from '../utils/hathor';
import { Network } from '@hathor/wallet-lib';
import Address from '@hathor/wallet-lib/lib/models/address';

interface SendDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SendDialog: React.FC<SendDialogProps> = ({ isOpen, onClose }) => {
  const [selectedToken, setSelectedToken] = useState('HTR');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [timelock, setTimelock] = useState('');
  const [dataOutput, setDataOutput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; address?: string }>({});
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const { sendTransaction, balances, network, refreshBalance } = useWallet();

  const availableBalance = balances.length > 0 ? balances[0].available : 0;

  const handleMaxClick = () => {
    if (availableBalance > 0) {
      setAmount(centsToHTR(availableBalance).toString());
    }
  };

  const validateForm = () => {
    const newErrors: { amount?: string; address?: string } = {};

    // Validate amount with comprehensive checks
    if (!amount || amount.trim() === '') {
      newErrors.amount = 'Amount is required';
    } else {
      // Check for valid number format (no scientific notation, max 2 decimals for HTR)
      const amountPattern = /^\d+(\.\d{1,2})?$/;
      if (!amountPattern.test(amount)) {
        newErrors.amount = 'Invalid amount format. Use up to 2 decimal places.';
      } else {
        const amountNum = parseFloat(amount);

        // Check if amount is positive
        if (amountNum <= 0) {
          newErrors.amount = 'Amount must be greater than 0';
        }
        // Check for integer overflow (JavaScript's MAX_SAFE_INTEGER / 100 for cents)
        else if (amountNum > Number.MAX_SAFE_INTEGER / 100) {
          newErrors.amount = 'Amount is too large';
        }
        // Check against available balance
        else {
          const amountInCents = htrToCents(amount);
          if (amountInCents > availableBalance) {
            newErrors.amount = 'Insufficient balance';
          }
        }
      }
    }

    // Validate address with proper checksum verification
    if (!address || address.trim().length === 0) {
      newErrors.address = 'Address is required';
    } else {
      try {
        const networkObj = new Network(network || 'dev-testnet');
        const addressObj = new Address(address.trim(), { network: networkObj });
        addressObj.validateAddress();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Invalid address';
        if (errorMsg.includes('checksum')) {
          newErrors.address = 'Invalid address checksum. Please check the address.';
        } else if (errorMsg.includes('network')) {
          newErrors.address = `Invalid address for ${network} network`;
        } else {
          newErrors.address = 'Invalid Hathor address format';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSend = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setTransactionError(null);

    try {
      const amountInCents = htrToCents(amount);

      const result = await sendTransaction({
        network: network || 'dev-testnet',
        outputs: [{
          address: address.trim(),
          value: amountInCents.toString(),
          token: '00'
        }]
      });

      console.log('Transaction sent successfully:', result);

      // Refresh balance after successful transaction
      await refreshBalance();

      // Reset form and close
      setAmount('');
      setAddress('');
      setTimelock('');
      setDataOutput('');
      setErrors({});
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
        <div className="p-6 space-y-6">
          {/* Select Token */}
          <div>
            <label className="block text-base font-bold text-white mb-2">
              Select Token
            </label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
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
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors({ ...errors, amount: undefined });
                }}
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
                onClick={handleMaxClick}
                className="text-xs text-primary hover:text-primary/80 transition-colors uppercase"
              >
                Max
              </button>
            </div>
            {errors.amount && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-red-400">{errors.amount}</span>
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
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (errors.address) setErrors({ ...errors, address: undefined });
              }}
              placeholder="Address"
              className={`w-full px-3 py-2 bg-[#0D1117] border ${
                errors.address ? 'border-red-500' : 'border-border'
              } rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
            />
            {errors.address && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-red-400">{errors.address}</span>
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
                    value={timelock}
                    onChange={(e) => setTimelock(e.target.value)}
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
                    value={dataOutput}
                    onChange={(e) => setDataOutput(e.target.value)}
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
            onClick={handleSend}
            disabled={isLoading || !amount || !address}
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
        </div>
      </div>
    </div>
  );
};

export default SendDialog;