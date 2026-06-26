'use client';

import { formatBetAmount } from '@/lib/dice/probability';

interface ResultDisplayProps {
  result: number;
  threshold: number;
  payout: number;
  betAmount: number;
}

export function ResultDisplay({ result, threshold, payout, betAmount }: ResultDisplayProps) {
  const won = payout > 0;
  const profit = payout - betAmount;

  return (
    <div
      className={`rounded-lg p-6 ${
        won
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300'
          : 'bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300'
      }`}
    >
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">{won ? '🎉' : '😔'}</div>
        <h3 className={`text-2xl font-bold ${won ? 'text-green-600' : 'text-red-600'}`}>
          {won ? 'You Won!' : 'You Lost'}
        </h3>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Roll Result:</span>
          <span className="font-bold">{(result / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Threshold:</span>
          <span className="font-bold">{(threshold / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Bet Amount:</span>
          <span className="font-bold">{formatBetAmount(betAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Payout:</span>
          <span className="font-bold">{formatBetAmount(payout)}</span>
        </div>
        <div className="pt-2 border-t border-gray-300">
          <div className="flex justify-between">
            <span className="text-gray-600">Profit/Loss:</span>
            <span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profit >= 0 ? '+' : ''}{formatBetAmount(profit)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        {won
          ? `You rolled under ${(threshold / 100).toFixed(2)} and won!`
          : `You needed to roll under ${(threshold / 100).toFixed(2)} to win.`}
      </div>
    </div>
  );
}
