import { useState } from 'react';
import { useInvokeSnap } from '@hathor/snap-utils';
import { DICE_CONTRACT_CONFIG } from '@/config/contract';
import type { AddLiquidityResult, RemoveLiquidityResult } from '@/lib/hathor/types';

export function useLiquidity() {
  const invokeSnap = useInvokeSnap();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Add liquidity to the pool
   */
  const addLiquidity = async (amount: number): Promise<AddLiquidityResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await invokeSnap({
        method: 'htr_sendNanoContractTx',
        params: {
          network: DICE_CONTRACT_CONFIG.network,
          nc_id: DICE_CONTRACT_CONFIG.contractId,
          nc_method: 'add_liquidity',
          nc_args: [],
          actions: [
            {
              type: 'deposit',
              token_uid: DICE_CONTRACT_CONFIG.tokenUid,
              amount: amount,
            },
          ],
        },
      });

      const adjustedAmount = response.response?.adjusted_amount || amount;
      const txId = response.response?.tx_id || '';

      return {
        adjustedAmount,
        txId,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add liquidity');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Remove liquidity from the pool
   */
  const removeLiquidity = async (amount: number): Promise<RemoveLiquidityResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await invokeSnap({
        method: 'htr_sendNanoContractTx',
        params: {
          network: DICE_CONTRACT_CONFIG.network,
          nc_id: DICE_CONTRACT_CONFIG.contractId,
          nc_method: 'remove_liquidity',
          nc_args: [],
          actions: [
            {
              type: 'withdrawal',
              token_uid: DICE_CONTRACT_CONFIG.tokenUid,
              amount: amount,
            },
          ],
        },
      });

      const withdrawnAmount = response.response?.withdrawn_amount || amount;
      const txId = response.response?.tx_id || '';

      return {
        withdrawnAmount,
        txId,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to remove liquidity');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Calculate maximum liquidity that can be removed
   * This is a view method, so it doesn't modify state
   */
  const calculateMaxRemoval = async (amount: number): Promise<number> => {
    try {
      // TODO: Implement view method call
      // This would call the contract's calculate_maximum_liquidity_removal view method
      // For now, returning the input amount as placeholder
      return amount;
    } catch (err) {
      console.error('Failed to calculate max removal:', err);
      return 0;
    }
  };

  return {
    addLiquidity,
    removeLiquidity,
    calculateMaxRemoval,
    isLoading,
    error,
  };
}
