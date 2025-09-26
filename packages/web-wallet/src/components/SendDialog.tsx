import React, { useState } from 'react';
import { X, ArrowUpRight, AlertCircle } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { formatHTRAmount, htrToCents, centsToHTR, isValidHTRAddress, HTR_TOKEN } from '../utils/hathor';

interface SendDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SendDialog: React.FC<SendDialogProps> = ({ isOpen, onClose }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { sendTransaction, balances, network, refreshBalance } = useWallet();

  const handleSend = async () => {
    if (!recipient || !amount || !sendTransaction) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Validate address
      if (!isValidHTRAddress(recipient)) {
        setError('Invalid HTR address format');
        return;
      }

      // Convert amount to cents using utility
      const amountInCents = htrToCents(amount);
      
      // Validate amount
      if (amountInCents <= 0) {
        setError('Amount must be greater than 0');
        return;
      }

      // Check if user has sufficient balance
      const availableBalance = balances.length > 0 ? balances[0].available : 0;
      if (amountInCents > availableBalance) {
        setError('Insufficient balance');
        return;
      }
      
      const result = await sendTransaction({
        network: network || 'mainnet',
        outputs: [{
          address: recipient,
          value: amountInCents.toString(),
          token: HTR_TOKEN.uid
        }]
      });
      
      console.log('Transaction sent successfully:', result);
      
      // Refresh balance after successful transaction
      await refreshBalance();
      
      // Close dialog and reset form
      onClose();
      setRecipient('');
      setAmount('');
    } catch (err) {
      console.error('Failed to send transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to send transaction');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-white">Send HTR</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-secondary/20 rounded transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Recipient Address */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="HTR address (e.g., H123...abc)"
              className={`w-full px-3 py-2 bg-secondary border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                recipient && !isValidHTRAddress(recipient) ? 'border-red-500' : 'border-border'
              }`}
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 pr-12 bg-secondary border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="absolute right-3 top-2 text-sm text-muted-foreground">HTR</span>
            </div>
          </div>

          {/* Available Balance */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Available: {balances.length > 0 ? 
              formatHTRAmount(balances[0].available) : 
              '0.00'} HTR</span>
            <button 
              onClick={() => setAmount(balances.length > 0 ? centsToHTR(balances[0].available).toString() : '0')}
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Max
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-100">{error}</p>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-100">
              Double-check the recipient address. Transactions cannot be reversed.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-transparent border border-border hover:bg-secondary/20 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!recipient || !amount || isLoading}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/80 disabled:bg-muted disabled:text-muted-foreground text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendDialog;