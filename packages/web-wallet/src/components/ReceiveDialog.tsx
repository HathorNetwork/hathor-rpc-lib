import React, { useState } from 'react';
import { X, Copy } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useWallet } from '../contexts/WalletContext';
import { QR_CODE_SIZE } from '../constants';

interface ReceiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReceiveDialog: React.FC<ReceiveDialogProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const { address } = useWallet();

  const handleCopy = async () => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#191C21] border border-[#24292F] rounded-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="relative flex items-center justify-center p-6">
          <h2 className="text-base font-bold text-primary-400">Receive Tokens</h2>
          <button
            onClick={onClose}
            className="absolute right-6 p-1 hover:bg-secondary/20 rounded transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center space-y-6 p-6 pt-0">
          {/* Subtitle */}
          <p className="text-sm text-muted-foreground text-center">
            Send HTR or custom tokens to this address.
          </p>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-lg">
              {address ? (
                <QRCode
                  value={address}
                  size={QR_CODE_SIZE}
                  level="H"
                />
              ) : (
                <div className={`w-[${QR_CODE_SIZE}px] h-[${QR_CODE_SIZE}px] bg-secondary flex items-center justify-center`}>
                  <p className="text-sm text-muted-foreground">No address available</p>
                </div>
              )}
            </div>
          </div>

          {/* Wallet Address - Centered without label */}
          <div className="w-full flex justify-center">
            <div className="px-4 py-3 bg-secondary border border-border rounded-lg max-w-full">
              <p className="text-sm text-white font-mono text-center break-all">
                {address || 'No address available'}
              </p>
            </div>
          </div>

          {/* Copy Button - Purple/Violet */}
          <button
            onClick={handleCopy}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Address copied!' : 'Copy address'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiveDialog;