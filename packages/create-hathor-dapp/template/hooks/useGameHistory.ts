import { useState, useEffect, useCallback } from 'react';
import { getGameHistory, addGameToHistory, clearGameHistory, type GameResult } from '@/lib/utils/storage';

export function useGameHistory(limit: number = 10) {
  const [history, setHistory] = useState<GameResult[]>([]);

  const loadHistory = useCallback(() => {
    const games = getGameHistory(limit);
    setHistory(games);
  }, [limit]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const addGame = (game: GameResult) => {
    addGameToHistory(game);
    loadHistory(); // Reload to update state
  };

  const clearHistory = () => {
    clearGameHistory();
    setHistory([]);
  };

  return {
    history,
    addGame,
    clearHistory,
    refresh: loadHistory,
  };
}
