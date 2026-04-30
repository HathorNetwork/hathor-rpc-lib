'use client';

import { DiceGame } from '@/components/dice/DiceGame';
import { ContractStats } from '@/components/contract/ContractStats';
import { GameHistory } from '@/components/dice/GameHistory';
import { ConnectWallet } from '@/components/wallet/ConnectWallet';
import { useMetaMaskContext } from '@hathor/snap-utils';

export default function Home() {
  const { installedSnap } = useMetaMaskContext();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-hathor-primary to-hathor-accent bg-clip-text text-transparent">
          🎲 Hathor Dice
        </h1>
        <p className="text-gray-600">Provably fair dice game on Hathor Network</p>
      </div>

      {!installedSnap ? (
        <div className="max-w-md mx-auto">
          <ConnectWallet />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game */}
          <div className="lg:col-span-2">
            <DiceGame />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ContractStats />
            <GameHistory />
          </div>
        </div>
      )}
    </main>
  );
}
