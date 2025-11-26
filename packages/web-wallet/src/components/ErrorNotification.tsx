import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorNotificationProps {
  error: Error | null;
  onDismiss: () => void;
}

/**
 * Error notification component that displays errors in a toast-like notification.
 * Can be manually dismissed by clicking the close button.
 */
const ErrorNotification: React.FC<ErrorNotificationProps> = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-5">
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-red-400 mb-1">Error</h3>
            <p className="text-sm text-red-300 break-words">{error.message}</p>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-red-500/20 rounded transition-colors flex-shrink-0"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorNotification;
