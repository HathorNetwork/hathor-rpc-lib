/**
 * Consolidated wallet-related type definitions
 * Central source of truth for wallet balance and transaction types
 */

export interface WalletBalance {
  token: string;
  available: bigint;
  locked: bigint;
}

/**
 * Map of token UID to balance for O(1) lookups
 */
export type WalletBalanceMap = Map<string, WalletBalance>;

export interface TransactionHistoryItem {
  tx_id: string;
  timestamp: number;
  balance: bigint;
  is_voided: boolean;
}
