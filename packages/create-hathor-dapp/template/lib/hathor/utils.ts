import { NETWORKS, NetworkName } from '@/config/contract';

/**
 * Format a balance for display
 * @param balance - Balance in cents
 * @returns Formatted string (e.g., "1,234.56")
 */
export function formatBalance(balance: number | bigint): string {
  const num = typeof balance === 'bigint' ? Number(balance) : balance;
  return (num / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Shorten an address for display
 * @param address - Full address string
 * @param chars - Number of characters to show on each end
 * @returns Shortened address (e.g., "0x1234...5678")
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Get the explorer URL for a transaction
 * @param txId - Transaction ID
 * @param network - Network name
 * @returns Full URL to transaction on explorer
 */
export function getExplorerUrl(txId: string, network: NetworkName = 'testnet'): string {
  const baseUrl = NETWORKS[network].explorerUrl;
  return `${baseUrl}/transaction/${txId}`;
}

/**
 * Get the explorer URL for an address
 * @param address - Wallet address
 * @param network - Network name
 * @returns Full URL to address on explorer
 */
export function getAddressExplorerUrl(address: string, network: NetworkName = 'testnet'): string {
  const baseUrl = NETWORKS[network].explorerUrl;
  return `${baseUrl}/address/${address}`;
}

/**
 * Validate a Hathor address (basic validation)
 * @param address - Address to validate
 * @returns True if address appears valid
 */
export function validateHathorAddress(address: string): boolean {
  // Basic validation - Hathor addresses start with 'H' and are 34 characters
  if (!address) return false;
  if (address.length !== 34) return false;
  if (!address.startsWith('H')) return false;
  return true;
}

/**
 * Parse a balance input string to cents
 * @param input - User input (e.g., "10.5" or "10,5")
 * @returns Balance in cents or null if invalid
 */
export function parseBalanceInput(input: string): number | null {
  const cleaned = input.replace(/,/g, '.');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || parsed < 0) return null;
  return Math.floor(parsed * 100);
}

/**
 * Format a timestamp for display
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Format a relative time (e.g., "2 minutes ago")
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

/**
 * Sleep for a specified duration
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after the duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
