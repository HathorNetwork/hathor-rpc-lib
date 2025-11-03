import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface UnregisterTokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  tokenSymbol: string;
  tokenName: string;
}

const UnregisterTokenDialog: React.FC<UnregisterTokenDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tokenSymbol,
  tokenName,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleUnregister = async () => {
    if (!isConfirmed) return;

    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Failed to unregister token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setIsConfirmed(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start md:items-center justify-center z-50 overflow-y-auto p-4 md:p-0">
      <div className="bg-[#191C21] border border-[#24292F] rounded-2xl w-full max-w-md my-4 md:my-0 md:mx-4">
        {/* Header */}
        <div className="relative flex items-center justify-center p-6 border-b border-[#24292F]">
          <h2 className="text-base font-bold text-primary-400">Unregister token</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="absolute right-6 p-1 hover:bg-secondary/20 rounded transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning Message */}
          <div className="space-y-4">
            <p className="text-sm text-white">
              If you unregister this token you won't be able to execute operations with it, unless you register it again.
            </p>
            <p className="text-sm text-muted-foreground">
              You won't lose your tokens, they will just not appear on this wallet anymore.
            </p>
          </div>

          {/* Confirmation Toggle */}
          <div className="flex items-center justify-between p-4 bg-[#0D1117] border border-border rounded-lg">
            <div>
              <p className="text-sm font-medium text-white">I want to unregister the token</p>
              <p className="text-xs text-muted-foreground mt-1">
                Token: {tokenSymbol} ({tokenName})
              </p>
            </div>
            <button
              onClick={() => setIsConfirmed(!isConfirmed)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                isConfirmed ? 'bg-primary' : 'bg-[#24292F]'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  isConfirmed ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Unregister Button */}
          <button
            onClick={handleUnregister}
            disabled={!isConfirmed || isLoading}
            className="w-full px-8 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Unregistering token
              </>
            ) : (
              'Unregister token'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnregisterTokenDialog;
