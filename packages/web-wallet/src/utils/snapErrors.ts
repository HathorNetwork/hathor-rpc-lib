/**
 * Utility functions for detecting and handling MetaMask Snap errors.
 */

/**
 * Error patterns that indicate the snap has crashed or become unresponsive.
 * These errors typically occur when:
 * - The snap process crashes (DataCloneError)
 * - Communication with the snap fails (postMessage errors)
 * - Data serialization fails (cloned errors)
 * - The snap times out (timeout)
 */
const SNAP_CRASH_INDICATORS = [
  'DataCloneError',
  'postMessage',
  'cloned',
  'timeout',
] as const;

/**
 * Error patterns that indicate authorization/permission issues.
 */
const UNAUTHORIZED_INDICATORS = [
  'Unauthorized',
  'permission',
] as const;

/**
 * Checks if an error message indicates the snap has crashed or become unresponsive.
 *
 * @param errorMessage - The error message to check
 * @returns true if the error indicates a snap crash
 *
 * @example
 * ```ts
 * try {
 *   await invokeSnap({ method: 'htr_getBalance' });
 * } catch (error) {
 *   if (isSnapCrashedError(error.message)) {
 *     // Handle snap crash - suggest page refresh
 *   }
 * }
 * ```
 */
export function isSnapCrashedError(errorMessage: string): boolean {
  return SNAP_CRASH_INDICATORS.some(indicator =>
    errorMessage.includes(indicator)
  );
}

/**
 * Checks if an error indicates an unauthorized/permission error.
 *
 * @param error - The error object to check
 * @returns true if the error indicates unauthorized access
 */
export function isUnauthorizedError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const errorObj = error as { code?: number; message?: string };

  // Check for error code 4100 (standard unauthorized code)
  if (errorObj.code === 4100) {
    return true;
  }

  // Check for unauthorized keywords in message
  if (errorObj.message) {
    return UNAUTHORIZED_INDICATORS.some(indicator =>
      errorObj.message!.includes(indicator)
    );
  }

  return false;
}

/**
 * Checks if an error indicates the snap needs to be reinstalled.
 *
 * @param errorMessage - The error message to check
 * @returns true if the snap needs reinstallation
 */
export function isSnapNotInstalledError(errorMessage: string): boolean {
  return (
    errorMessage.includes('not installed') ||
    errorMessage.includes('Snap not found')
  );
}

/**
 * Checks if an error indicates the snap is blocked or disabled.
 *
 * @param errorMessage - The error message to check
 * @returns true if the snap is blocked or disabled
 */
export function isSnapDisabledError(errorMessage: string): boolean {
  return (
    errorMessage.includes('blocked') ||
    errorMessage.includes('disabled')
  );
}

/**
 * Gets a user-friendly error message for snap errors.
 *
 * @param errorMessage - The original error message
 * @returns A user-friendly error message
 */
export function getSnapErrorUserMessage(errorMessage: string): string {
  if (isSnapCrashedError(errorMessage)) {
    return 'MetaMask Snap is not responding. Please refresh the page and try again.';
  }

  if (isSnapNotInstalledError(errorMessage)) {
    return 'Snap not installed. Please connect your wallet.';
  }

  if (isSnapDisabledError(errorMessage)) {
    if (errorMessage.includes('blocked')) {
      return 'Snap is blocked. Please enable it in MetaMask settings.';
    }
    return 'Snap is disabled. Please enable it in MetaMask settings.';
  }

  return errorMessage || 'An unknown error occurred';
}
