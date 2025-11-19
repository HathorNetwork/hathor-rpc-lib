import React, { useState, useEffect } from 'react';
import { X, Copy } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useWallet } from '../contexts/WalletContext';
import { QR_CODE_SIZE } from '../constants';
import { readOnlyWalletService } from '../services/ReadOnlyWalletService';
import { getAddressForMode } from '../utils/addressMode';
import { useToast } from '@/hooks/use-toast';

interface ReceiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReceiveDialog: React.FC<ReceiveDialogProps> = ({ isOpen, onClose }) => {
  const [displayAddress, setDisplayAddress] = useState<string>('');
  const { addressMode } = useWallet();
  const { toast } = useToast();

  // Get address based on address mode when dialog opens
  useEffect(() => {
    const loadAddress = async () => {
      if (isOpen && readOnlyWalletService.isReady()) {
        try {
          const addr = await getAddressForMode(addressMode, readOnlyWalletService);
          setDisplayAddress(addr);
        } catch (error) {
          console.error('Failed to get address for receive dialog:', error);
          setDisplayAddress('');
        }
      }
    };
    loadAddress();
  }, [isOpen, addressMode]);

  const handleCopy = async () => {
    if (!displayAddress) return;

    try {
      await navigator.clipboard.writeText(displayAddress);
      toast({
        variant: "success",
        title: "Address copied to clipboard",
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start md:items-center justify-center z-50 overflow-y-auto p-4 md:p-0">
      <div className="bg-[#191C21] border border-[#24292F] rounded-2xl w-full max-w-md my-4 md:my-0 md:mx-4">
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
              {displayAddress ? (
                <QRCode
                  value={displayAddress}
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
                {displayAddress || 'No address available'}
              </p>
            </div>
          </div>

          {/* Copy Button - Purple/Violet */}
          <button
            onClick={handleCopy}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
          >
            <Copy className="w-4 h-4" />
            Copy address
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiveDialog;