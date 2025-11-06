'use client';

import { useMetaMaskContext } from '@hathor/snap-utils';
import { AddLiquidity } from '@/components/liquidity/AddLiquidity';
import { RemoveLiquidity } from '@/components/liquidity/RemoveLiquidity';
import { LiquidityPosition } from '@/components/liquidity/LiquidityPosition';
import { LiquidityPool } from '@/components/liquidity/LiquidityPool';
import { ConnectWallet } from '@/components/wallet/ConnectWallet';

export default function LiquidityPage() {
  const { installedSnap } = useMetaMaskContext();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
          💰 Liquidity Pool
        </h1>
        <p className="text-gray-600">Provide liquidity and earn from the house edge</p>
      </div>

      {!installedSnap ? (
        <div className="max-w-md mx-auto">
          <ConnectWallet />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Pool Stats */}
            <LiquidityPool />

            {/* User Position */}
            <LiquidityPosition />

            {/* Add Liquidity */}
            <AddLiquidity />

            {/* Remove Liquidity */}
            <RemoveLiquidity />
          </div>

          {/* Info Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
            <h2 className="text-xl font-bold mb-4 text-gray-800">📚 How Liquidity Providing Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <h3 className="font-semibold mb-2">✅ Benefits</h3>
                <ul className="space-y-1">
                  <li>• Earn passive income from house edge</li>
                  <li>• Proportional share of all profits</li>
                  <li>• Withdraw anytime (with available liquidity)</li>
                  <li>• No lockup period required</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">⚠️ Risks</h3>
                <ul className="space-y-1">
                  <li>• Players may win big, reducing pool value</li>
                  <li>• Withdrawal limited by available liquidity</li>
                  <li>• Smart contract risks</li>
                  <li>• Value fluctuates with game outcomes</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white rounded border border-blue-300">
              <p className="text-xs text-gray-600">
                <strong>Example:</strong> If you provide 1,000 HTR to a 10,000 HTR pool, you own 10% of the pool.
                When players lose 100 HTR to the house edge, you earn 10 HTR (10% of 100 HTR).
              </p>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
