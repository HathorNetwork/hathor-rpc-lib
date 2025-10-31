import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { TokenInfo } from '../types/token';
import { formatHTRAmount } from '../utils/hathor';

interface TokenListProps {
  tokens: TokenInfo[];
  onTokenClick: (tokenUid: string) => void;
  onSendClick: (tokenUid: string) => void;
}

const TokenList: React.FC<TokenListProps> = ({
  tokens,
  onTokenClick,
  onSendClick,
}) => {
  const handleSendClick = (tokenUid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSendClick(tokenUid);
  };

  if (tokens.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No tokens to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tokens.map((token) => {
        return (
          <button
            key={token.uid}
            onClick={() => onTokenClick(token.uid)}
            className="w-full bg-[#191C21] border border-[#24292F] rounded-lg px-6 py-8 flex items-center justify-between hover:bg-primary-600/40 transition-colors group"
          >
            <div className="space-y-1 text-left">
              <div className="text-base font-medium text-white">{token.symbol}</div>
              <div className="text-sm text-muted-foreground">{token.name}</div>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-lg font-medium text-white">
                {formatHTRAmount(token.balance.available)}
              </span>

              {/* Send Button */}
              <div
                onClick={(e) => handleSendClick(token.uid, e)}
                className="px-4 py-2 bg-transparent hover:bg-secondary/20 text-white rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Send</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default TokenList;
