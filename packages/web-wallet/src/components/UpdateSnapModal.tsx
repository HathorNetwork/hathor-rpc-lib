import React from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';

interface UpdateSnapModalProps {
  isOpen: boolean;
  installedVersion: string;
  minVersion: string;
}

/**
 * Indismissable modal that blocks the user from using the wallet
 * until they update their Snap to the minimum required version.
 */
export const UpdateSnapModal: React.FC<UpdateSnapModalProps> = ({
  isOpen,
  installedVersion,
  minVersion,
}) => {
  if (!isOpen) return null;

  const handleUpdateClick = () => {
    // Open MetaMask Snaps directory or update instructions
    window.open('https://snaps.metamask.io/snap/npm/hathor/snap', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
      <div className="bg-[#191C21] border border-[#24292F] rounded-2xl w-full max-w-md">
        {/* Header with Alert Icon */}
        <div className="flex items-center justify-center p-6 border-b border-[#24292F]">
          <AlertCircle className="w-6 h-6 text-yellow-400 mr-3" />
          <h2 className="text-lg font-bold text-white">Snap Update Required</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Main Message */}
          <div className="space-y-3">
            <p className="text-white text-base">
              Your Hathor Snap version is outdated and no longer supported by this wallet.
            </p>
            <p className="text-muted-foreground text-sm">
              Please update your Snap to continue using the Hathor Web Wallet.
            </p>
          </div>

          {/* Version Info */}
          <div className="bg-[#0D1117] border border-border rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Installed Version:</span>
              <span className="text-red-400 font-mono">{installedVersion}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Required Version:</span>
              <span className="text-green-400 font-mono">{minVersion}+</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              <strong>How to update:</strong>
            </p>
            <ol className="list-decimal list-inside text-sm text-muted-foreground mt-2 space-y-1">
              <li>Click the button below to open MetaMask Snaps</li>
              <li>Find the Hathor Snap</li>
              <li>Click "Update" if available</li>
              <li>Refresh this page after updating</li>
            </ol>
          </div>

          {/* Update Button */}
          <button
            onClick={handleUpdateClick}
            className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            <span>Update Snap</span>
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Footer Note */}
          <p className="text-xs text-muted-foreground text-center">
            This wallet requires Snap version {minVersion} or higher for security and compatibility.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpdateSnapModal;
