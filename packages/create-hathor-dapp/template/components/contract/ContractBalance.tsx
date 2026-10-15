'use client';

import { useContractBalance } from '@/hooks/useContractBalance';
import { formatBalance } from '@/lib/hathor/utils';
import { ClaimBalance } from './ClaimBalance';

export function ContractBalance() {
  const { balance, isLoading, refetch } = useContractBalance();

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mt-2"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">Your Balance in Contract</div>
          <div className="text-2xl font-bold text-green-600">
            {formatBalance(balance)} HTR
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={refetch}
            className="p-2 hover:bg-green-100 rounded-full transition-colors"
            title="Refresh balance"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          {balance > 0 && <ClaimBalance balance={balance} onClaim={refetch} />}
        </div>
      </div>
    </div>
  );
}
