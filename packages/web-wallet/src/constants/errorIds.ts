/**
 * Error IDs for tracking and categorizing errors across the application.
 * These IDs can be used with error tracking services like Sentry.
 */
export const ErrorIds = {
  // Wallet Connection Errors (1xxx)
  WALLET_CONNECTION_FAILED: 'ERR_1001',
  WALLET_SNAP_NOT_RESPONDING: 'ERR_1002',
  WALLET_NETWORK_CHANGE_FAILED: 'ERR_1003',
  WALLET_XPUB_EXTRACTION_FAILED: 'ERR_1004',
  WALLET_INITIALIZATION_FAILED: 'ERR_1005',
  WALLET_AUTO_RECONNECT_FAILED: 'ERR_1006',

  // Transaction Errors (2xxx)
  TRANSACTION_SEND_FAILED: 'ERR_2001',
  TRANSACTION_INSUFFICIENT_BALANCE: 'ERR_2002',
  TRANSACTION_INVALID_AMOUNT: 'ERR_2003',
  TRANSACTION_INVALID_ADDRESS: 'ERR_2004',
  TRANSACTION_USER_REJECTED: 'ERR_2005',

  // Network Errors (3xxx)
  NETWORK_CHANGE_FAILED: 'ERR_3001',
  NETWORK_ROLLBACK_FAILED: 'ERR_3002',
  NETWORK_INVALID_NETWORK: 'ERR_3003',

  // Service Errors (4xxx)
  SERVICE_WALLET_NOT_READY: 'ERR_4001',
  SERVICE_BALANCE_FETCH_FAILED: 'ERR_4002',
  SERVICE_HISTORY_FETCH_FAILED: 'ERR_4003',
  SERVICE_ADDRESS_FETCH_FAILED: 'ERR_4004',
  SERVICE_SNAP_NOT_RESPONDING: 'ERR_4005',

  // Validation Errors (5xxx)
  VALIDATION_INVALID_XPUB: 'ERR_5001',
  VALIDATION_INVALID_ADDRESS: 'ERR_5002',
  VALIDATION_INVALID_AMOUNT: 'ERR_5003',

  // Unknown/Generic Errors (9xxx)
  UNKNOWN_ERROR: 'ERR_9999',
} as const;

export type ErrorId = typeof ErrorIds[keyof typeof ErrorIds];

/**
 * Create an error with an error ID for tracking
 */
export class TrackedError extends Error {
  constructor(
    message: string,
    public readonly errorId: ErrorId,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TrackedError';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      errorId: this.errorId,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Log error with ID and context (can be integrated with Sentry later)
 */
export function logError(
  errorId: ErrorId,
  message: string,
  context?: Record<string, unknown>
): void {
  console.error(`[${errorId}] ${message}`, context);
  // TODO: Integrate with Sentry or other error tracking service
  // Sentry.captureException(new TrackedError(message, errorId, context));
}
