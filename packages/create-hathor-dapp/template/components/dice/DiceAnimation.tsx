'use client';

interface DiceAnimationProps {
  isRolling: boolean;
  result: number | null;
}

export function DiceAnimation({ isRolling, result }: DiceAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative w-32 h-32 mb-4">
        {isRolling ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-8xl animate-spin">🎲</div>
          </div>
        ) : result !== null ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-8xl">🎲</div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-8xl opacity-50">🎲</div>
          </div>
        )}
      </div>

      {result !== null && !isRolling && (
        <div className="text-center">
          <div className="text-4xl font-bold text-hathor-primary mb-2">
            {(result / 100).toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">
            Roll Result
          </div>
        </div>
      )}

      {isRolling && (
        <div className="text-center">
          <div className="text-lg font-medium text-gray-700 animate-pulse">
            Rolling the dice...
          </div>
        </div>
      )}
    </div>
  );
}
