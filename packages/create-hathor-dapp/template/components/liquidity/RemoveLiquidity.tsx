'use client';

import { useState } from 'react';
import { useLiquidity } from '@/hooks/useLiquidity';
import { parseBalanceInput, formatBalance } from '@/lib/hathor/utils';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function RemoveLiquidity() {
  const { removeLiquidity, calculateMaxRemoval, isLoading } = useLiquidity();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [maxRemoval, setMaxRemoval] = useState<number | null>(null);

  const handleCalculateMax = async () => {
    const amountInCents = parseBalanceInput(amount);
    if (!amountInCents || amountInCents <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      const max = await calculateMaxRemoval(amountInCents);
      setMaxRemoval(max);
    } catch (err) {
      setError('Failed to calculate maximum removal');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const amountInCents = parseBalanceInput(amount);
    if (!amountInCents || amountInCents <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      const result = await removeLiquidity(amountInCents);
      setSuccess(`Successfully removed ${formatBalance(result.withdrawnAmount)} HTR from the pool!`);
      setAmount('');
      setMaxRemoval(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove liquidity');
    }
  };

  return (
    <Card title="➖ Remove Liquidity">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="number"
          label="Amount (HTR)"
          placeholder="100.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isLoading}
          helperText="Enter your liquidity position amount"
          step="0.01"
          min="0.01"
        />

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleCalculateMax}
            disabled={isLoading || !amount}
            variant="secondary"
            className="flex-1"
          >
            Calculate Max
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={isLoading || !amount}
            variant="danger"
            className="flex-1"
          >
            Remove
          </Button>
        </div>

        {maxRemoval !== null && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-blue-700 text-sm">
            Maximum withdrawal: {formatBalance(maxRemoval)} HTR
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded p-3 text-green-700 text-sm">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Withdrawals include your profits from the house edge</p>
          <p>• Calculate max to see your current position value</p>
          <p>• Subject to available liquidity in the pool</p>
        </div>
      </form>
    </Card>
  );
}
