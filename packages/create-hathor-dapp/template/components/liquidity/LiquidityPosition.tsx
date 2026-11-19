'use client';

import { useState, useEffect } from 'react';
import { formatBalance } from '@/lib/hathor/utils';
import { Card } from '../ui/Card';

export function LiquidityPosition() {
  // TODO: Fetch real position from contract
  const [position, setPosition] = useState({
    amount: 0,
    share: 0,
    estimatedValue: 0,
  });

  const roi = position.estimatedValue > 0 && position.amount > 0
    ? ((position.estimatedValue - position.amount) / position.amount) * 100
    : 0;

  return (
    <Card title="💼 Your Position">
      <div className="space-y-4">
        {position.amount > 0 ? (
          <>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-hathor-primary">
                  {formatBalance(position.amount)} HTR
                </div>
                <div className="text-sm text-gray-600 mt-1">Your Contribution</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {position.share.toFixed(2)}%
                </div>
                <div className="text-xs text-gray-600 mt-1">Pool Share</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {formatBalance(position.estimatedValue)} HTR
                </div>
                <div className="text-xs text-gray-600 mt-1">Est. Value</div>
              </div>
            </div>

            <div className={`text-center p-3 rounded-lg ${roi >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
              </div>
              <div className="text-xs text-gray-600 mt-1">Return on Investment</div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">You haven't provided liquidity yet</p>
            <p className="text-sm">Add liquidity to start earning from the house edge!</p>
          </div>
        )}
      </div>
    </Card>
  );
}
