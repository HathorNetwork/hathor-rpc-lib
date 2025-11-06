import { useState, useEffect } from 'react';
import { getGameHistory, addGameToHistory, clearGameHistory, type GameResult } from '@/lib/utils/storage';

export function useGameHistory(limit: number = 10) {
  const [history, setHistory] = useState<GameResult[]>([]);

  useEffect(() => {
    loadHistory();
  }, [limit]);

  const loadHistory = () => {
    const games = getGameHistory(limit);
    setHistory(games);
  };

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
