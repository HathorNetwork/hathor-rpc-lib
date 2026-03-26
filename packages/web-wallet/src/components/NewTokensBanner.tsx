import React from 'react';
import { X, Info } from 'lucide-react';

interface NewTokensBannerProps {
  tokenCount: number;
  onImportClick: () => void;
  onDismiss: () => void;
}

const NewTokensBanner: React.FC<NewTokensBannerProps> = ({
  tokenCount,
  onImportClick,
  onDismiss,
}) => {
  if (tokenCount === 0) return null;

  return (
    <div className="bg-green-600/90 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Info className="w-5 h-5 text-white flex-shrink-0" />
        <p className="text-sm text-white">
          <span className="font-bold">New tokens</span>
          {' '}
          We found tokens linked to your address that are not yet in your wallet.
          {' '}
          <button
            onClick={onImportClick}
            className="font-bold underline hover:text-white/90 transition-colors"
          >
            Import tokens.
          </button>
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4 text-white" />
      </button>
    </div>
  );
};

export default NewTokensBanner;
