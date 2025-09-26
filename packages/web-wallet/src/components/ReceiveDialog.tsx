import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
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
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-white">Receive HTR</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-secondary/20 rounded transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
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

          {/* Wallet Address */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Your Wallet Address
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg">
                <p className="text-sm text-white font-mono break-all">
                  {address || 'No address available'}
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="p-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors flex items-center justify-center"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-primary mt-1">Address copied to clipboard!</p>
            )}
          </div>

          {/* Instructions */}
          <div className="p-4 bg-secondary/50 rounded-lg">
            <h3 className="text-sm font-medium text-white mb-2">How to receive HTR:</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Share this address with the sender</li>
              <li>• Or show them the QR code (when available)</li>
              <li>• Wait for the transaction to be confirmed</li>
              <li>• Funds will appear in your wallet automatically</li>
            </ul>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-secondary hover:bg-secondary/80 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiveDialog;