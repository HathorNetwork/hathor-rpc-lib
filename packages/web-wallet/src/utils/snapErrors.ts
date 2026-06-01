/**
 * Utility functions for mapping errors observed when calling the snap — both
 * snap-side failures (crashes, missing/blocked snap, permission issues) and
 * wallet-lib errors propagated through it (e.g. UTXO shortages).
 */

import { constants, TokenVersion } from '@hathor/wallet-lib';

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
 * Checks whether the error message indicates an HTR UTXO shortage raised by
 * wallet-lib. Anchored on the trailing period so custom token UIDs that
 * happen to start with the HTR prefix (e.g. `'00abc.'`) are not
 * misclassified.
 *
 * @param errorMessage - The error message to check
 * @returns true if the error indicates an HTR UTXO shortage
 */
export function isHtrUtxoShortage(errorMessage: string): boolean {
  return errorMessage.includes(`No UTXOs available for the token ${constants.NATIVE_TOKEN_UID}.`);
}

/**
 * Checks whether the error message indicates a UTXO shortage for a custom
 * (non-HTR) token. Returns false for HTR shortages so the two cases can be
 * handled with distinct messages.
 *
 * @param errorMessage - The error message to check
 * @returns true if the error indicates a non-HTR token UTXO shortage
 */
export function isTokenUtxoShortage(errorMessage: string): boolean {
  return (
    errorMessage.includes('No UTXOs available for the token ') &&
    !isHtrUtxoShortage(errorMessage)
  );
}

/**
 * Best-effort extraction of a string message from any thrown value.
 * Handles Error instances, JSON-RPC-style `{message: string}` objects, and
 * anything else by falling back to the provided default.
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === 'string' && m.length > 0) return m;
  }
  return fallback;
}

/**
 * Optional context that disambiguates the HTR-shortage message. The same
 * wallet-lib error (`"No UTXOs available for the token 00."`) means different
 * things depending on which token the caller is operating on:
 *
 * - `TokenVersion.NATIVE`  → user is sending HTR itself; the shortage is the
 *   transfer amount, not a fee.
 * - `TokenVersion.DEPOSIT` → deposit-token operation; HTR shortage means the
 *   1% deposit (not a "network fee").
 * - `TokenVersion.FEE`     → fee-token operation; HTR shortage is the network
 *   fee. Same as the default when no context is given.
 */
export interface SnapErrorContext {
  tokenVersion?: TokenVersion;
}

/**
 * Gets a user-friendly error message for snap errors.
 *
 * @param errorMessage - The original error message
 * @param context - Optional operation context to tailor HTR-shortage messages
 * @returns A user-friendly error message
 */
export function getSnapErrorUserMessage(
  errorMessage: string,
  context?: SnapErrorContext,
): string {
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

  // wallet-lib raises "No UTXOs available for the token <uid>." when
  // auto-selection can't cover the amount. The HTR-shortage message depends
  // on the token the caller is dealing with (see SnapErrorContext).
  if (isHtrUtxoShortage(errorMessage)) {
    switch (context?.tokenVersion) {
      case TokenVersion.NATIVE:
        return 'Insufficient balance to send this transaction.';
      case TokenVersion.DEPOSIT:
        return 'Insufficient HTR balance for deposit.';
      case TokenVersion.FEE:
      default:
        return 'Insufficient HTR to cover the network fee.';
    }
  }
  if (isTokenUtxoShortage(errorMessage)) {
    return 'Insufficient balance to send this transaction.';
  }

  return errorMessage || 'An unknown error occurred';
}
