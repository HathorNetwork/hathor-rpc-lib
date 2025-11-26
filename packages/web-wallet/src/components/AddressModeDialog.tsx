import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import type { AddressMode } from '../utils/addressMode';

interface AddressModeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddressModeDialog: React.FC<AddressModeDialogProps> = ({ isOpen, onClose }) => {
  const { addressMode, setAddressMode } = useWallet();
  const [selectedMode, setSelectedMode] = useState<AddressMode>(addressMode);

  // Update local state when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedMode(addressMode);
    }
  }, [isOpen, addressMode]);

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

          {/* Radio Options */}
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
                  <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-opacity"></div>
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
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="radio"
                  name="addressMode"
                  value="single"
                  checked={selectedMode === 'single'}
                  onChange={(e) => setSelectedMode(e.target.value as AddressMode)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 border-2 border-border rounded-full bg-[#0D1117] peer-checked:border-primary peer-checked:bg-[#0D1117] transition-all flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                </div>
              </div>
              <div className="flex-1">
                <span className="text-sm text-white font-medium block">Single Address</span>
                <span className="text-xs text-muted-foreground block mt-1">
                  Always use the same address (index 0)
                </span>
              </div>
            </label>
          </div>

          {/* Save Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleSave}
              className="px-8 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium"
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
