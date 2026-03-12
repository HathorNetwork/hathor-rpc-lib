'use client';

import { useState } from 'react';
import { useLiquidity } from '@/hooks/useLiquidity';
import { parseBalanceInput, formatBalance } from '@/lib/hathor/utils';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function AddLiquidity() {
  const { addLiquidity, isLoading } = useLiquidity();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      const result = await addLiquidity(amountInCents);
      setSuccess(`Successfully added ${formatBalance(result.adjustedAmount)} HTR to the pool!`);
      setAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add liquidity');
    }
  };

  return (
    <Card title="➕ Add Liquidity">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="number"
          label="Amount (HTR)"
          placeholder="100.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isLoading}
          helperText="Minimum: 1 HTR"
          step="0.01"
          min="0.01"
        />

        <Button
          type="submit"
          isLoading={isLoading}
          disabled={isLoading || !amount}
          className="w-full"
        >
          Add Liquidity
        </Button>

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
          <p>• Earn from the 1.90% house edge</p>
          <p>• Your share = your contribution / total pool</p>
          <p>• Withdraw anytime (subject to available liquidity)</p>
        </div>
      </form>
    </Card>
  );
}
