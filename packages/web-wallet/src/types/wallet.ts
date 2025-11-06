/**
 * Consolidated wallet-related type definitions
 * Central source of truth for wallet balance and transaction types
 */

export interface WalletBalance {
  token: string;
  available: bigint;
  locked: bigint;
}

export interface TransactionHistoryItem {
  tx_id: string;
  timestamp: number;
  balance: bigint;
  is_voided: boolean;
}
