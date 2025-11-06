import { prettyValue } from '@hathor/wallet-lib/lib/utils/numbers';
import { HTR_DECIMAL_MULTIPLIER } from '../constants';

/**
 * Format token amount using Hathor's prettyValue utility
 * @param amount Amount in base units - can be number or BigInt
 * @param isNft Whether this is an NFT (uses 0 decimals) or regular token (uses 2 decimals)
 * @returns Formatted string
 */
export const formatHTRAmount = (amount: number | bigint, isNft: boolean = false): string => {
  const amountValue = typeof amount === 'bigint' ? Number(amount) : amount;
  const decimalPlaces = isNft ? 0 : 2;
  return prettyValue(amountValue, decimalPlaces);
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
