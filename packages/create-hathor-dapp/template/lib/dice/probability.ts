import { DICE_CONTRACT_CONFIG } from '@/config/contract';

const { houseEdgeBasisPoints, maxRoll } = DICE_CONTRACT_CONFIG;

/**
 * Calculate win chance based on threshold
 * @param threshold - The threshold value (0-9999)
 * @returns Win chance as a percentage (0-100)
 */
export function calculateWinChance(threshold: number): number {
  return (threshold / maxRoll) * 100;
}

/**
 * Calculate payout multiplier based on threshold
 * Takes house edge into account
 * @param threshold - The threshold value (0-9999)
 * @returns Payout multiplier (e.g., 2.0 means 2x bet)
 */
export function calculatePayout(threshold: number): number {
  const winChance = threshold / maxRoll;
  const houseEdge = houseEdgeBasisPoints / 10000;

  // Payout = (1 / winChance) * (1 - houseEdge)
  const multiplier = (1 / winChance) * (1 - houseEdge);

  return multiplier;
}

/**
 * Calculate expected payout for a bet
 * @param betAmount - The amount to bet (in cents)
 * @param threshold - The threshold value (0-9999)
 * @returns Expected payout amount (in cents)
 */
export function calculateExpectedPayout(
  betAmount: number,
  threshold: number
): number {
  const multiplier = calculatePayout(threshold);
  return Math.floor(betAmount * multiplier);
}

/**
 * Calculate the house edge percentage
 * @returns House edge as a percentage
 */
export function getHouseEdgePercent(): number {
  return houseEdgeBasisPoints / 100;
}

/**
 * Validate bet parameters
 * @param betAmount - The amount to bet (in cents)
 * @param threshold - The threshold value (0-9999)
 * @param maxBet - Maximum allowed bet (in cents)
 * @returns Validation result with error message if invalid
 */
export function validateBet(
  betAmount: number,
  threshold: number,
  maxBet: number = DICE_CONTRACT_CONFIG.maxBetAmount
): { valid: boolean; error?: string } {
  if (betAmount <= 0) {
    return { valid: false, error: 'Bet amount must be positive' };
  }

  if (!Number.isInteger(betAmount)) {
    return { valid: false, error: 'Bet amount must be a whole number' };
  }

  if (betAmount > maxBet) {
    return { valid: false, error: `Max bet is ${maxBet / 100} HTR` };
  }

  if (threshold < 100 || threshold > 9900) {
    return { valid: false, error: 'Threshold must be between 1% and 99%' };
  }

  if (!Number.isInteger(threshold)) {
    return { valid: false, error: 'Threshold must be a whole number' };
  }

  return { valid: true };
}

/**
 * Format a bet amount for display
 * @param amount - Amount in cents
 * @returns Formatted string (e.g., "100.00 HTR")
 */
export function formatBetAmount(amount: number): string {
  return `${(amount / 100).toFixed(2)} HTR`;
}

/**
 * Format a threshold for display
 * @param threshold - Threshold value (0-9999)
 * @returns Formatted string (e.g., "50.00%")
 */
export function formatThreshold(threshold: number): string {
  return `${(threshold / 100).toFixed(2)}%`;
}
