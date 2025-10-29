import { prettyValue } from '@hathor/wallet-lib/lib/utils/numbers';
import { HTR_DECIMAL_MULTIPLIER } from '../constants';

/**
 * Format HTR amount using Hathor's prettyValue utility
 * @param amount Amount in cents (satoshis) - can be number or BigInt
 * @returns Formatted string
 */
export const formatHTRAmount = (amount: number | bigint): string => {
  const amountValue = typeof amount === 'bigint' ? Number(amount) : amount;
  return prettyValue(amountValue);
};

/**
 * Convert HTR amount from string to cents
 * @param amount Amount as string (e.g., "10.50")
 * @returns Amount in cents
 */
export const htrToCents = (amount: string): number => {
  return Math.floor(parseFloat(amount) * HTR_DECIMAL_MULTIPLIER);
};

/**
 * Convert cents to HTR amount
 * @param cents Amount in cents (can be number or BigInt)
 * @returns Amount as number
 */
export const centsToHTR = (cents: number | bigint): number => {
  const centsValue = typeof cents === 'bigint' ? Number(cents) : cents;
  return centsValue / HTR_DECIMAL_MULTIPLIER;
};

/**
 * Truncate address for display
 * @param address Full address
 * @param prefixLength Length of prefix to show
 * @param suffixLength Length of suffix to show
 * @returns Truncated address
 */
export const truncateAddress = (address: string, prefixLength = 7, suffixLength = 7): string => {
  if (address.length <= prefixLength + suffixLength) {
    return address;
  }
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
};

/**
 * Validate HTR address format
 * @param address Address to validate
 * @returns True if valid format
 */
export const isValidHTRAddress = (address: string): boolean => {
  // Basic HTR address validation - starts with 'H' or 'W' and has correct length
  return /^[HW][a-zA-Z0-9]{32,34}$/.test(address);
};

/**
 * Format transaction hash for display
 * @param hash Transaction hash
 * @returns Formatted hash
 */
export const formatTxHash = (hash: string): string => {
  return truncateAddress(hash, 10, 8);
};
