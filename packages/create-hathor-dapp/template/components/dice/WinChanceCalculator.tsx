'use client';

import { calculateWinChance, calculatePayout, getHouseEdgePercent } from '@/lib/dice/probability';

interface WinChanceCalculatorProps {
  threshold: number;
  betAmount?: number;
}

export function WinChanceCalculator({ threshold, betAmount }: WinChanceCalculatorProps) {
  const winChance = calculateWinChance(threshold);
  const multiplier = calculatePayout(threshold);
  const houseEdge = getHouseEdgePercent();
  const potentialWin = betAmount ? Math.floor(betAmount * multiplier) : 0;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-bold text-purple-600">
            {winChance.toFixed(2)}%
          </div>
          <div className="text-xs md:text-sm text-gray-600 mt-1">Win Chance</div>
        </div>
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-bold text-blue-600">
            {multiplier.toFixed(2)}x
          </div>
          <div className="text-xs md:text-sm text-gray-600 mt-1">Multiplier</div>
        </div>
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-bold text-green-600">
            {houseEdge.toFixed(2)}%
          </div>
          <div className="text-xs md:text-sm text-gray-600 mt-1">House Edge</div>
        </div>
        {betAmount && (
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-indigo-600">
              {(potentialWin / 100).toFixed(2)}
            </div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Potential Win (HTR)</div>
          </div>
        )}
      </div>
    </div>
  );
}
