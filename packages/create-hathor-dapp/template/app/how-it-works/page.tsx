export default function HowItWorksPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center">How Hathor Dice Works</h1>

      <div className="space-y-8">
        {/* Game Mechanics */}
        <section className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-hathor-primary">🎲 Game Mechanics</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              Hathor Dice is a provably fair dice game where you choose your bet amount and win threshold.
              The game generates a random number between 0 and 99.99, and you win if the result is{' '}
              <strong>under</strong> your chosen threshold.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <p className="font-semibold mb-2">Example:</p>
              <ul className="space-y-1 text-sm">
                <li>• You bet 100 HTR with a threshold of 50.00</li>
                <li>• The dice rolls 42.15</li>
                <li>• Since 42.15 {'<'} 50.00, you win!</li>
                <li>• Your payout is calculated based on the multiplier</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Probability & Payouts */}
        <section className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-hathor-primary">📊 Probability & Payouts</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              The payout multiplier is calculated based on your win chance and the house edge (1.90%):
            </p>
            <div className="bg-gray-50 rounded p-4 font-mono text-sm">
              Multiplier = (1 / Win Chance) × (1 - House Edge)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-purple-50 border border-purple-200 rounded p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">50%</div>
                <div className="text-sm text-gray-600 mt-1">Win Chance</div>
                <div className="text-xl font-bold text-gray-800 mt-2">1.96x</div>
                <div className="text-xs text-gray-500">Multiplier</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">25%</div>
                <div className="text-sm text-gray-600 mt-1">Win Chance</div>
                <div className="text-xl font-bold text-gray-800 mt-2">3.92x</div>
                <div className="text-xs text-gray-500">Multiplier</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
                <div className="text-2xl font-bold text-green-600">10%</div>
                <div className="text-sm text-gray-600 mt-1">Win Chance</div>
                <div className="text-xl font-bold text-gray-800 mt-2">9.81x</div>
                <div className="text-xs text-gray-500">Multiplier</div>
              </div>
            </div>
          </div>
        </section>

        {/* Provably Fair */}
        <section className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-hathor-primary">🔒 Provably Fair</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              This game uses Hathor's nano contracts to ensure fairness. The random number generation happens
              on-chain and cannot be manipulated by the house or players.
            </p>
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <p className="font-semibold mb-2">Why it's provably fair:</p>
              <ul className="space-y-1 text-sm">
                <li>✅ Random numbers generated using blockchain entropy</li>
                <li>✅ All game logic runs in a nano contract (immutable)</li>
                <li>✅ Every bet is recorded on-chain</li>
                <li>✅ You can verify results using the transaction ID</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Nano Contracts */}
        <section className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-hathor-primary">⚡ Nano Contracts</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              Hathor Dice is powered by nano contracts - lightweight smart contracts on the Hathor Network.
              When you place a bet:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Your HTR is deposited into the contract</li>
              <li>The contract generates a random number</li>
              <li>The contract calculates your payout based on the result</li>
              <li>Winnings are automatically added to your contract balance</li>
              <li>You can claim your balance at any time</li>
            </ol>
            <div className="bg-purple-50 border border-purple-200 rounded p-4 mt-4">
              <p className="text-sm">
                <strong>Note:</strong> Your balance stays in the contract until you claim it. This saves on
                transaction fees if you want to play multiple rounds!
              </p>
            </div>
          </div>
        </section>

        {/* Liquidity Pool */}
        <section className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-hathor-primary">💰 Liquidity Pool</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              The game is backed by a liquidity pool where anyone can provide HTR to earn from the house edge.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <h3 className="font-semibold mb-2">For Players</h3>
                <p className="text-sm">
                  The pool ensures there's always liquidity to pay out big wins. Max bet is limited to protect
                  the pool.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h3 className="font-semibold mb-2">For Providers</h3>
                <p className="text-sm">
                  Earn passive income from the 1.90% house edge. Your share of profits is proportional to your
                  contribution.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Getting Started */}
        <section className="bg-gradient-to-r from-hathor-primary to-hathor-secondary rounded-lg shadow-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-4">🚀 Getting Started</h2>
          <ol className="space-y-3">
            <li className="flex items-start">
              <span className="font-bold mr-2">1.</span>
              <span>Install MetaMask browser extension and the Hathor Snap</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">2.</span>
              <span>Connect your wallet on the Play page</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">3.</span>
              <span>Choose your bet amount and win threshold</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">4.</span>
              <span>Roll the dice and win HTR!</span>
            </li>
          </ol>
        </section>
      </div>
    </main>
  );
}
