import React, { useState } from 'react';
import { ArrowUpRight, Trash2, Loader2 } from 'lucide-react';
import type { TokenInfo } from '../types/token';
import { formatHTRAmount } from '../utils/hathor';
import { TOKEN_IDS } from '../constants';

interface TokenListProps {
  tokens: TokenInfo[];
  onTokenClick: (tokenUid: string) => void;
  onSendClick: (tokenUid: string) => void;
  onUnregister?: (tokenUid: string) => Promise<void>;
}

const TokenList: React.FC<TokenListProps> = ({
  tokens,
  onTokenClick,
  onSendClick,
  onUnregister,
}) => {
  const [unregisteringToken, setUnregisteringToken] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleUnregisterClick = async (tokenUid: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Prevent HTR from being unregistered
    if (tokenUid === TOKEN_IDS.HTR) {
      console.warn('Cannot unregister HTR token');
      return;
    }

    if (confirmDelete !== tokenUid) {
      // First click: ask for confirmation
      setConfirmDelete(tokenUid);
      // Auto-cancel after 3 seconds
      setTimeout(() => {
        setConfirmDelete(null);
      }, 3000);
      return;
    }

    // Second click: actually unregister
    if (onUnregister) {
      setUnregisteringToken(tokenUid);
      try {
        await onUnregister(tokenUid);
        setConfirmDelete(null);
      } catch (error) {
        console.error('Failed to unregister token:', error);
      } finally {
        setUnregisteringToken(null);
      }
    }
  };

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
        const isHTR = token.uid === TOKEN_IDS.HTR;
        const isUnregistering = unregisteringToken === token.uid;
        const isConfirmingDelete = confirmDelete === token.uid;

        return (
          <button
            key={token.uid}
            onClick={() => onTokenClick(token.uid)}
            disabled={isUnregistering}
            className="w-full bg-[#191C21] border border-[#24292F] rounded-lg px-6 py-8 flex items-center justify-between hover:bg-primary-600/40 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
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

              {/* Unregister Button (only for custom tokens) */}
              {!isHTR && onUnregister && (
                <button
                  onClick={(e) => handleUnregisterClick(token.uid, e)}
                  disabled={isUnregistering}
                  className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    isConfirmingDelete
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-transparent hover:bg-secondary/20 text-muted-foreground hover:text-white'
                  }`}
                  title={isConfirmingDelete ? 'Click again to confirm' : 'Remove token'}
                >
                  {isUnregistering ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      {isConfirmingDelete && <span>Confirm?</span>}
                    </>
                  )}
                </button>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default TokenList;
