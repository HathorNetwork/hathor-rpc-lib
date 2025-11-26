import { errorCodes } from '@metamask/rpc-errors';
import { errors } from '@hathor/wallet-lib';

/**
 * Wallet-lib errors for type checking and catching specific wallet errors.
 */
export const WalletLibErrors = errors;

/**
 * Error message patterns for wallet connection operations.
 * Centralized to avoid magic strings throughout the codebase.
 *
 * Note: For wallet-lib specific errors, prefer using WalletLibErrors
 * (e.g., WalletLibErrors.XPubError).
 */
export const ERROR_PATTERNS = {
  ABORTED: 'aborted',
  ALREADY_INITIALIZING: 'Wallet is already initializing',
  AUTHENTICATION: 'authentication',
  WALLET_ALREADY_LOADED: 'wallet-already-loaded',
  // MetaMask Snap-specific errors
  SNAP_NOT_INSTALLED: 'Snap not installed',
  SNAP_BLOCKED: 'Snap is blocked',
  SNAP_DISABLED: 'Snap is disabled',
  SNAP_CONNECTION_FAILED: 'Failed to connect to snap',
} as const;

/**
 * MetaMask/Provider error codes from @metamask/rpc-errors.
 * Use these for checking error types instead of string matching.
 */
export const PROVIDER_ERROR_CODES = {
  USER_REJECTED: errorCodes.provider.userRejectedRequest, // 4001
  UNAUTHORIZED: errorCodes.provider.unauthorized, // 4100
} as const;

/**
 * Check if an error has a specific error code.
 */
export function hasErrorCode(error: unknown, code: number): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}
