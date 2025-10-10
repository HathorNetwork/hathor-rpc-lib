import { prettyValue } from '@hathor/wallet-lib/lib/utils/numbers';

/**
 * Format HTR amount using Hathor's prettyValue utility
 * @param amount Amount in cents (satoshis)
 * @returns Formatted string
 */
export const formatHTRAmount = (amount: number): string => {
  return prettyValue(amount);
};

/**
 * Convert HTR amount from string to cents
 * @param amount Amount as string (e.g., "10.50")
 * @returns Amount in cents
 */
export const htrToCents = (amount: string): number => {
  return Math.floor(parseFloat(amount) * 100);
};

/**
 * Convert cents to HTR amount
 * @param cents Amount in cents
 * @returns Amount as number
 */
export const centsToHTR = (cents: number): number => {
  return cents / 100;
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
 * HTR token constants
 */
export const HTR_TOKEN = {
  uid: '00',
  name: 'Hathor',
  symbol: 'HTR'
};

/**
 * Format transaction hash for display
 * @param hash Transaction hash
 * @returns Formatted hash
 */
export const formatTxHash = (hash: string): string => {
  return truncateAddress(hash, 10, 8);
};
