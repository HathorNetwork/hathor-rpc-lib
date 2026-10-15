/**
 * Type-safe localStorage utilities
 */

export interface GameResult {
  timestamp: number;
  betAmount: number;
  threshold: number;
  randomNumber: number;
  payout: number;
  won: boolean;
  txId?: string;
}

const STORAGE_KEYS = {
  GAME_HISTORY: 'hathor-dice-history',
  USER_PREFERENCES: 'hathor-dice-preferences',
} as const;

/**
 * Get game history from localStorage
 * @param limit - Maximum number of games to return
 * @returns Array of game results
 */
export function getGameHistory(limit: number = 50): GameResult[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.GAME_HISTORY);
    if (!stored) return [];

    const history = JSON.parse(stored) as GameResult[];
    return history.slice(0, limit);
  } catch (error) {
    console.error('Failed to load game history:', error);
    return [];
  }
}

/**
 * Add a game result to history
 * @param game - Game result to add
 */
export function addGameToHistory(game: GameResult): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getGameHistory();
    history.unshift(game); // Add to beginning

    // Keep only last 100 games
    const trimmed = history.slice(0, 100);

    localStorage.setItem(STORAGE_KEYS.GAME_HISTORY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save game to history:', error);
  }
}

/**
 * Clear game history
 */
export function clearGameHistory(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEYS.GAME_HISTORY);
  } catch (error) {
    console.error('Failed to clear game history:', error);
  }
}

/**
 * Get user preferences
 */
export interface UserPreferences {
  defaultBetAmount?: number;
  defaultThreshold?: number;
  soundEnabled?: boolean;
  animationsEnabled?: boolean;
}

export function getUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    if (!stored) return {};

    return JSON.parse(stored) as UserPreferences;
  } catch (error) {
    console.error('Failed to load user preferences:', error);
    return {};
  }
}

/**
 * Save user preferences
 */
export function saveUserPreferences(preferences: UserPreferences): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save user preferences:', error);
  }
}
