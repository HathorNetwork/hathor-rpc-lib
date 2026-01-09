import { useState } from 'react';
import { useInvokeSnap } from '@hathor/snap-utils';
import { DICE_CONTRACT_CONFIG } from '@/config/contract';
import type { PlaceBetResult } from '@/lib/hathor/types';
import { addGameToHistory } from '@/lib/utils/storage';

/**
 * Hook to place a bet on the dice contract
 */
export function usePlaceBet() {
  const invokeSnap = useInvokeSnap();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const placeBet = async (
    betAmount: number,
    threshold: number
  ): Promise<PlaceBetResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Send the nano contract transaction
      // This will:
      // 1. Deposit the bet amount into the contract
      // 2. Call the place_bet method with threshold parameter
      // 3. Return the result (random number and payout)

      const response = await invokeSnap({
        method: 'htr_sendNanoContractTx',
        params: {
          network: DICE_CONTRACT_CONFIG.network,
          nc_id: DICE_CONTRACT_CONFIG.contractId,
          nc_method: 'place_bet',
          nc_args: [betAmount, threshold],
          actions: [
            {
              type: 'deposit',
              token_uid: DICE_CONTRACT_CONFIG.tokenUid,
              amount: betAmount,
            },
          ],
        },
      });

      // Parse the response
      // Note: The actual response structure depends on the nano contract implementation
      // This is a placeholder structure
      const txId = response.response?.tx_id || '';
      const payout = response.response?.payout || 0;
      const randomNumber = response.response?.random_number || 0;
      const won = payout > 0;

      // Store in local history
      addGameToHistory({
        timestamp: Date.now(),
        betAmount,
        threshold,
        randomNumber,
        payout,
        won,
        txId,
      });

      return {
        randomNumber,
        payout,
        won,
        txId,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to place bet');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { placeBet, isLoading, error };
}
