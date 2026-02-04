'use client';

import { useState } from 'react';
import { useInvokeSnap } from '@hathor/snap-utils';
import { DICE_CONTRACT_CONFIG } from '@/config/contract';
import { Button } from '../ui/Button';

interface ClaimBalanceProps {
  balance: number;
  onClaim: () => void;
}

export function ClaimBalance({ balance, onClaim }: ClaimBalanceProps) {
  const invokeSnap = useInvokeSnap();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    if (balance <= 0) return;

    setIsLoading(true);
    setError(null);

    try {
      await invokeSnap({
        method: 'htr_sendNanoContractTx',
        params: {
          network: DICE_CONTRACT_CONFIG.network,
          nc_id: DICE_CONTRACT_CONFIG.contractId,
          nc_method: 'claim_balance',
          nc_args: [],
          actions: [
            {
              type: 'withdrawal',
              token_uid: DICE_CONTRACT_CONFIG.tokenUid,
              amount: balance,
            },
          ],
        },
      });

      // Refresh balance after successful claim
      onClaim();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to claim balance';
      setError(errorMessage);
      console.error('Failed to claim balance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleClaim}
        disabled={isLoading || balance <= 0}
        isLoading={isLoading}
        size="sm"
        variant="primary"
      >
        Claim
      </Button>
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}
