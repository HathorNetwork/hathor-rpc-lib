import React, { useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, Eye, X } from 'lucide-react';
import { formatHTRAmount } from '../utils/hathor';

interface TransactionNotificationProps {
  transaction: {
    type: 'sent' | 'received';
    amount: number;
    timestamp: number;
  } | null;
  onDismiss: () => void;
  onViewHistory: () => void;
}

/**
 * Transaction notification component that displays new transactions in a toast-like notification.
 * Auto-dismisses after 5 seconds but can be manually dismissed.
 */
const TransactionNotification: React.FC<TransactionNotificationProps> = ({
  transaction,
  onDismiss,
  onViewHistory,
}) => {
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!transaction) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [transaction, onDismiss]);

  if (!transaction) return null;

  const isReceived = transaction.type === 'received';
  const bgColor = isReceived ? 'bg-green-500/10' : 'bg-blue-500/10';
  const borderColor = isReceived ? 'border-green-500/50' : 'border-blue-500/50';
  const textColor = isReceived ? 'text-green-400' : 'text-blue-400';
  const iconColor = isReceived ? 'text-green-400' : 'text-blue-400';

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-5">
      <div className={`${bgColor} border ${borderColor} rounded-lg p-4 shadow-lg backdrop-blur-sm`}>
        <div className="flex items-start gap-3">
          <div className={`p-1.5 rounded-lg ${isReceived ? 'bg-green-500/20' : 'bg-blue-500/20'} flex-shrink-0`}>
            {isReceived ? (
              <ArrowDownLeft className={`w-4 h-4 ${iconColor}`} />
            ) : (
              <ArrowUpRight className={`w-4 h-4 ${iconColor}`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-semibold ${textColor} mb-1`}>
              {isReceived ? 'Received' : 'Sent'} HTR
            </h3>
            <p className={`text-sm ${textColor} font-medium`}>
              {isReceived ? '+' : '-'}
              {formatHTRAmount(transaction.amount, false)} HTR
            </p>
            <button
              onClick={onViewHistory}
              className={`mt-2 text-xs ${textColor} hover:underline flex items-center gap-1`}
            >
              <Eye className="w-3 h-3" />
              View History
            </button>
          </div>
          <button
            onClick={onDismiss}
            className={`p-1 ${isReceived ? 'hover:bg-green-500/20' : 'hover:bg-blue-500/20'} rounded transition-colors flex-shrink-0`}
            aria-label="Dismiss notification"
          >
            <X className={`w-4 h-4 ${textColor}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionNotification;
