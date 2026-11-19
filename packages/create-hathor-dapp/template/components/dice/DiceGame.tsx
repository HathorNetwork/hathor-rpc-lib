'use client';

import { useState } from 'react';
import { BetControls } from './BetControls';
import { DiceAnimation } from './DiceAnimation';
import { ResultDisplay } from './ResultDisplay';
import { WinChanceCalculator } from './WinChanceCalculator';
import { usePlaceBet } from '@/hooks/usePlaceBet';
import { validateBet } from '@/lib/dice/probability';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ContractBalance } from '../contract/ContractBalance';

export function DiceGame() {
  const [betAmount, setBetAmount] = useState(10000); // 100 HTR in cents
  const [threshold, setThreshold] = useState(5000); // 50.00 (50%)
  const [isRolling, setIsRolling] = useState(false);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [lastPayout, setLastPayout] = useState<number | null>(null);

  const { placeBet, isLoading, error } = usePlaceBet();

  const handleRoll = async () => {
    // Validate bet
    const validation = validateBet(betAmount, threshold);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setIsRolling(true);
    setLastResult(null);
    setLastPayout(null);

    try {
      // Simulate dice roll animation delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = await placeBet(betAmount, threshold);

      // Show result after animation
      setLastResult(result.randomNumber);
      setLastPayout(result.payout);
    } catch (err) {
      console.error('Bet failed:', err);
      // Error is already set by the hook
    } finally {
      setIsRolling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Contract Balance */}
      <ContractBalance />

      {/* Main Game Card */}
      <Card title="🎲 Roll the Dice">
        <div className="space-y-6">
          {/* Win Chance Display */}
          <WinChanceCalculator threshold={threshold} betAmount={betAmount} />

          {/* Bet Controls */}
          <BetControls
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            threshold={threshold}
            setThreshold={setThreshold}
            disabled={isRolling || isLoading}
          />

          {/* Dice Animation */}
          <DiceAnimation isRolling={isRolling} result={lastResult} />

          {/* Roll Button */}
          <Button
            onClick={handleRoll}
            disabled={isRolling || isLoading}
            isLoading={isRolling || isLoading}
            className="w-full"
            size="lg"
          >
            {isRolling ? 'Rolling...' : 'Roll Dice'}
          </Button>

          {/* Result Display */}
          {lastResult !== null && lastPayout !== null && !isRolling && (
            <ResultDisplay
              result={lastResult}
              threshold={threshold}
              payout={lastPayout}
              betAmount={betAmount}
            />
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
              <p className="font-medium">Error placing bet:</p>
              <p className="text-sm mt-1">{error.message}</p>
            </div>
          )}
        </div>
      </Card>

      {/* How to Play */}
      <Card title="ℹ️ How to Play">
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>1.</strong> Choose your bet amount (1-1,000 HTR)
          </p>
          <p>
            <strong>2.</strong> Set your threshold (1%-99%)
          </p>
          <p>
            <strong>3.</strong> Click "Roll Dice" to play
          </p>
          <p>
            <strong>4.</strong> Win if the roll is <strong>under</strong> your threshold!
          </p>
          <p className="text-xs text-gray-500 mt-4">
            The house edge is 1.90%. This game is provably fair and powered by Hathor nano contracts.
          </p>
        </div>
      </Card>
    </div>
  );
}
