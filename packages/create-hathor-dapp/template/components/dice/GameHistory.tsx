'use client';

import { useGameHistory } from '@/hooks/useGameHistory';
import { formatBetAmount } from '@/lib/dice/probability';
import { formatRelativeTime } from '@/lib/hathor/utils';
import { Card } from '../ui/Card';

export function GameHistory() {
  const { history, clearHistory } = useGameHistory(10);

  if (history.length === 0) {
    return (
      <Card title="Recent Games">
        <p className="text-gray-500 text-center py-8">No games played yet</p>
      </Card>
    );
  }

  return (
    <Card title="Recent Games">
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {history.map((game, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border-2 ${
              game.won
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">
                {formatRelativeTime(game.timestamp)}
              </span>
              <span className={`text-sm font-bold ${game.won ? 'text-green-600' : 'text-red-600'}`}>
                {game.won ? '+' : '-'}{formatBetAmount(Math.abs(game.payout - game.betAmount))}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Bet: {formatBetAmount(game.betAmount)}</span>
              <span>Roll: {(game.randomNumber / 100).toFixed(2)}</span>
              <span>Target: {'<'}{(game.threshold / 100).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
      {history.length > 0 && (
        <button
          onClick={clearHistory}
          className="mt-4 w-full text-sm text-gray-600 hover:text-red-600 transition-colors"
        >
          Clear History
        </button>
      )}
    </Card>
  );
}
