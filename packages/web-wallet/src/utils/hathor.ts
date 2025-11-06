import { prettyValue } from '@hathor/wallet-lib/lib/utils/numbers';
import { constants } from '@hathor/wallet-lib';

const DECIMAL_PLACES = constants.DECIMAL_PLACES; // 2
const DECIMAL_MULTIPLIER = BigInt(10 ** DECIMAL_PLACES); // 100n

/**
 * Safely convert a value to BigInt, handling number, bigint, and string inputs.
 *
 * @example
 * toBigInt(12345) // 12345n
 * toBigInt(12345n) // 12345n
 * toBigInt("12345") // 12345n
 *
 * @param value Value to convert to BigInt
 * @returns BigInt representation of the value
 */
export const toBigInt = (value: number | bigint | string): bigint => {
  return typeof value === 'bigint' ? value : BigInt(value);
};

/**
 * Format an amount in cents (satoshis) to a human-readable HTR string.
 * Uses wallet-lib's prettyValue which handles BigInt natively.
 *
 * @example
 * formatHTRAmount(12345n) // "123.45"
 * formatHTRAmount(1000000n) // "10,000.00"
 *
 * @param amount Amount in cents (satoshis) - can be number or BigInt
 * @param isNft Whether this is an NFT (uses 0 decimals) or regular token (uses 2 decimals)
 * @returns Formatted string with decimal places and thousand separators
 */
export const formatHTRAmount = (amount: number | bigint, isNft: boolean = false): string => {
  // prettyValue handles bigint | number | string natively, no conversion needed
  const decimalPlaces = isNft ? 0 : DECIMAL_PLACES;
  return prettyValue(amount, decimalPlaces);
};

/**
 * Parse HTR amount string to cents (satoshis) using precise BigInt arithmetic.
 * Avoids floating-point precision loss by using string manipulation and BigInt.
 *
 * @example
 * htrToCents("123.45") // 12345n
 * htrToCents("10") // 1000n
 * htrToCents("0.01") // 1n
 *
 * @param amount Amount as string (e.g., "10.50")
 * @returns Amount in cents as BigInt
 * @throws Error if amount format is invalid
 */
export const htrToCents = (amount: string): bigint => {
  // Validate format - must be digits with optional decimal (max 2 places)
  const trimmed = amount.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error('Invalid amount format. Use up to 2 decimal places.');
  }

  // Split into integer and decimal parts
  const [integerPart, decimalPart = ''] = trimmed.split('.');

  // Pad decimal to 2 places: "5" -> "50", "5" -> "50", "" -> "00"
  const paddedDecimal = decimalPart.padEnd(DECIMAL_PLACES, '0');

  // Construct cents value: combine integer and decimal parts
  // Example: "123.45" -> "123" + "45" -> 12345n
  const centsString = integerPart + paddedDecimal;
  const result = BigInt(centsString);

  // Validate positive after BigInt conversion (avoids parseFloat precision issues)
  if (result <= 0n) {
    throw new Error('Amount must be greater than 0');
  }

  return result;
};

/**
 * Convert cents (satoshis) to HTR decimal string for form inputs.
 * Returns plain numeric string without formatting (no thousand separators).
 *
 * @example
 * centsToHTR(12345n) // "123.45"
 * centsToHTR(1000000n) // "10000.00"
 * centsToHTR(1n) // "0.01"
 *
 * @param cents Amount in cents (can be number or BigInt)
 * @returns Amount as string with decimal point
 */
export const centsToHTR = (cents: number | bigint): string => {
  const amount = toBigInt(cents);

  // Perform BigInt division and modulo to split integer and decimal parts
  const integerPart = amount / DECIMAL_MULTIPLIER;
  // For negative amounts, modulo returns negative, so take absolute value
  const decimalPart = amount < 0n ? -(amount % DECIMAL_MULTIPLIER) : (amount % DECIMAL_MULTIPLIER);

  // Format decimal part with leading zeros if needed
  // Example: 5n -> "05", 50n -> "50"
  const decimalString = decimalPart.toString().padStart(DECIMAL_PLACES, '0');

  return `${integerPart}.${decimalString}`;
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
