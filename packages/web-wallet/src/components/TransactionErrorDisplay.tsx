import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import ErrorDetailsModal from './ErrorDetailsModal';
import type { ErrorDetails } from './ErrorDetailsModal';

/**
 * Extended error type that may include data from snap errors
 */
interface SnapError extends Error {
  data?: {
    errorType?: string;
    stack?: string;
    [key: string]: unknown;
  };
  code?: number;
}

interface TransactionErrorDisplayProps {
  /** The error object or error message string */
  error: Error | SnapError | string;
  /** Optional: Show a refresh/reconnect button for permission errors */
  onRefreshClick?: () => void;
  /** Optional: Custom class names for the container */
  className?: string;
}

/**
 * A reusable error display component with "Advanced options" collapsible
 * that reveals a "See error details" button for viewing stack traces.
 */
const TransactionErrorDisplay: React.FC<TransactionErrorDisplayProps> = ({
  error,
  onRefreshClick,
  className = '',
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Parse the error into a structured format
  // Handles both regular errors and snap errors with data property
  const errorDetails: ErrorDetails = useMemo(() => {
    if (typeof error === 'string') {
      return {
        type: 'Error',
        message: error,
        timestamp: new Date(),
        stack: undefined,
      };
    }

    // Check if this is a snap error with data property
    const snapError = error as SnapError;
    const errorType = snapError.data?.errorType || error.name || 'Error';
    const stack = snapError.data?.stack || error.stack;

    return {
      type: errorType,
      message: error.message || 'An unknown error occurred',
      timestamp: new Date(),
      stack,
    };
  }, [error]);

  const errorMessage = typeof error === 'string' ? error : error.message;
  const isPermissionError = errorMessage.includes('permission');

  return (
    <>
      <div className={`flex flex-col gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg ${className}`}>
        {/* Error Message */}
        <span className="text-red-400 text-sm whitespace-pre-line">{errorMessage}</span>

        {/* Permission Error: Refresh Button */}
        {isPermissionError && onRefreshClick && (
          <button
            type="button"
            onClick={onRefreshClick}
            className="text-xs text-primary hover:text-primary/80 underline self-start"
          >
            Click here to refresh and reconnect
          </button>
        )}

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors self-start mt-1"
        >
          {showAdvanced ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          Advanced options
        </button>

        {/* Advanced Options Content */}
        {showAdvanced && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowErrorDetails(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#24292F] hover:bg-[#30363D] rounded text-sm text-white transition-colors"
            >
              <AlertCircle className="w-4 h-4" />
              See error details
            </button>
          </div>
        )}
      </div>

      {/* Error Details Modal */}
      <ErrorDetailsModal
        isOpen={showErrorDetails}
        onClose={() => setShowErrorDetails(false)}
        error={errorDetails}
      />
    </>
  );
};

export default TransactionErrorDisplay;
