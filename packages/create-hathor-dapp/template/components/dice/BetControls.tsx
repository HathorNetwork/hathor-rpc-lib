'use client';

import { formatBetAmount, formatThreshold } from '@/lib/dice/probability';

interface BetControlsProps {
  betAmount: number;
  setBetAmount: (amount: number) => void;
  threshold: number;
  setThreshold: (threshold: number) => void;
  disabled?: boolean;
}

export function BetControls({
  betAmount,
  setBetAmount,
  threshold,
  setThreshold,
  disabled,
}: BetControlsProps) {
  return (
    <div className="space-y-6">
      {/* Bet Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bet Amount: <span className="text-hathor-primary font-bold">{formatBetAmount(betAmount)}</span>
        </label>
        <input
          type="range"
          min="100"
          max="100000"
          step="100"
          value={betAmount}
          onChange={(e) => setBetAmount(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-hathor-primary"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1 HTR</span>
          <span>1,000 HTR</span>
        </div>
      </div>

      {/* Threshold (Roll Under) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Roll Under: <span className="text-hathor-primary font-bold">{formatThreshold(threshold)}</span>
        </label>
        <input
          type="range"
          min="100"
          max="9900"
          step="100"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-hathor-primary"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1%</span>
          <span>99%</span>
        </div>
      </div>

      {/* Quick Selection Buttons */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Quick Select:</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '25%', value: 2500 },
            { label: '50%', value: 5000 },
            { label: '75%', value: 7500 },
            { label: '99%', value: 9900 },
          ].map((preset) => (
            <button
              key={preset.value}
              onClick={() => setThreshold(preset.value)}
              disabled={disabled}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                threshold === preset.value
                  ? 'bg-hathor-primary text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
