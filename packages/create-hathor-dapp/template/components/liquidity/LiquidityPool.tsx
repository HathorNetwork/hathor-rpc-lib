'use client';

import { DICE_CONTRACT_CONFIG } from '@/config/contract';
import { formatBalance } from '@/lib/hathor/utils';
import { Card } from '../ui/Card';

export function LiquidityPool() {
  // TODO: Fetch real pool stats from contract
  const poolStats = {
    totalLiquidity: 1000000_00, // 10,000 HTR
    availableLiquidity: 800000_00, // 8,000 HTR
    totalProviders: 15,
    houseEdge: DICE_CONTRACT_CONFIG.houseEdgeBasisPoints / 100,
  };

  const utilizationRate =
    ((poolStats.totalLiquidity - poolStats.availableLiquidity) / poolStats.totalLiquidity) * 100;

  return (
    <Card title="🏦 Liquidity Pool">
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {formatBalance(poolStats.totalLiquidity)} HTR
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Pool Size</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-gray-800">
              {formatBalance(poolStats.availableLiquidity)} HTR
            </div>
            <div className="text-xs text-gray-600 mt-1">Available</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-gray-800">
              {utilizationRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600 mt-1">In Use</div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Providers:</span>
            <span className="font-bold">{poolStats.totalProviders}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">House Edge:</span>
            <span className="font-bold">{poolStats.houseEdge.toFixed(2)}%</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
          💡 Liquidity providers earn a share of the house edge proportional to their contribution.
        </div>
      </div>
    </Card>
  );
}
