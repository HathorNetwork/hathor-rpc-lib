import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import type { AddressMode } from '../utils/addressMode';
import { readOnlyWalletWrapper } from '../services/ReadOnlyWalletWrapper';

interface AddressModeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddressModeDialog: React.FC<AddressModeDialogProps> = ({ isOpen, onClose }) => {
  const { addressMode, setAddressMode } = useWallet();
  const [selectedMode, setSelectedMode] = useState<AddressMode>(addressMode);
  const [isLoading, setIsLoading] = useState(false);
  const [hasTxOutside, setHasTxOutside] = useState<boolean | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  // Check for transactions outside first address when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMode(addressMode);
      checkTransactionsOutsideFirstAddress();
    }
  }, [isOpen, addressMode]);

  const checkTransactionsOutsideFirstAddress = async () => {
    if (!readOnlyWalletWrapper.isReady()) {
      setCheckError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setCheckError(null);

    try {
      const hasTransactions = await readOnlyWalletWrapper.hasTxOutsideFirstAddress();
      setHasTxOutside(hasTransactions);
    } catch (error) {
      setCheckError('Failed to check address usage');
      setHasTxOutside(true); // Default to true on error to prevent enabling single address mode without proper check
      console.error('Failed to check hasTxOutsideFirstAddress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isSingleModeDisabled = hasTxOutside === true;

  const handleSave = async () => {
    await setAddressMode(selectedMode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start md:items-center justify-center z-50 overflow-y-auto p-4 md:p-0">
      <div className="bg-[#191C21] border border-[#24292F] rounded-2xl w-full max-w-md my-4 md:my-0 md:mx-4">
        {/* Header */}
        <div className="relative flex items-center justify-center p-6 border-b border-[#24292F]">
          <h2 className="text-lg font-medium text-primary-400">Address mode</h2>
          <button
            onClick={onClose}
            className="absolute right-6 p-1 hover:bg-secondary/20 rounded transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Choose how your receiving addresses should behave.
            </p>
            <p className="text-sm text-muted-foreground">
              By default, a new address is generated for each request.
            </p>
            <p className="text-sm text-muted-foreground">
              You can choose to always use the same address instead.
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Checking address usage...</span>
            </div>
          )}

          {/* Error State */}
          {checkError && (
            <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{checkError}</p>
            </div>
          )}

          {/* Warning Banner (shown when single mode is disabled) */}
          {hasTxOutside && (
            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-white font-medium">Single Address mode unavailable</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your wallet has transactions on multiple addresses. Switching to Single Address
                  mode could hide funds on other addresses. Continue using Dynamic Address mode
                  to access all your funds.
                </p>
              </div>
            </div>
          )}

          {/* Radio Options */}
          {!isLoading && (
            <div className="space-y-4">
              {/* Dynamic Address */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="radio"
                    name="addressMode"
                    value="dynamic"
                    checked={selectedMode === 'dynamic'}
                    onChange={(e) => setSelectedMode(e.target.value as AddressMode)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 border-2 border-border rounded-full bg-[#0D1117] peer-checked:border-primary peer-checked:bg-[#0D1117] transition-all flex items-center justify-center">
                    <div className={`w-2.5 h-2.5 rounded-full bg-primary transition-opacity ${selectedMode === 'dynamic' ? 'opacity-100' : 'opacity-0'}`}></div>
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-sm text-white font-medium block">Dynamic Address</span>
                  <span className="text-xs text-muted-foreground block mt-1">
                    A new address is generated for each request (default)
                  </span>
                </div>
              </label>

              {/* Single Address */}
              <label
                className={`flex items-start gap-3 ${
                  isSingleModeDisabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer group'
                }`}
              >
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="radio"
                    name="addressMode"
                    value="single"
                    checked={selectedMode === 'single'}
                    onChange={(e) => setSelectedMode(e.target.value as AddressMode)}
                    disabled={isSingleModeDisabled}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 border-2 border-border rounded-full bg-[#0D1117] peer-checked:border-primary peer-checked:bg-[#0D1117] transition-all flex items-center justify-center">
                    <div className={`w-2.5 h-2.5 rounded-full bg-primary transition-opacity ${selectedMode === 'single' ? 'opacity-100' : 'opacity-0'}`}></div>
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-sm text-white font-medium block">Single Address</span>
                  <span className="text-xs text-muted-foreground block mt-1">
                    Always use the same address (index 0)
                  </span>
                  {isSingleModeDisabled && (
                    <span className="text-xs text-yellow-500 block mt-1">
                      Not available - transactions exist on other addresses
                    </span>
                  )}
                </div>
              </label>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-8 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressModeDialog;
