'use client';

import { DICE_CONTRACT_CONFIG } from '@/config/contract';
import { formatBalance } from '@/lib/hathor/utils';
import { Card } from '../ui/Card';

export function ContractStats() {
  const { houseEdgeBasisPoints, maxBetAmount } = DICE_CONTRACT_CONFIG;

  // TODO: Fetch real stats from contract
  // For now, showing static/placeholder values
  const stats = {
    totalLiquidity: 1000000_00, // 10,000 HTR
    houseEdge: houseEdgeBasisPoints / 100,
    maxBet: maxBetAmount,
    totalBets: 0,
    totalVolume: 0,
  };

  return (
    <Card title="📊 Contract Stats">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Liquidity</span>
          <span className="font-bold text-hathor-primary">
            {formatBalance(stats.totalLiquidity)} HTR
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">House Edge</span>
          <span className="font-bold">{stats.houseEdge.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Max Bet</span>
          <span className="font-bold">{formatBalance(stats.maxBet)} HTR</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Bets</span>
          <span className="font-bold">{stats.totalBets.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Volume</span>
          <span className="font-bold">{formatBalance(stats.totalVolume)} HTR</span>
        </div>
      </div>
    </Card>
  );
}
