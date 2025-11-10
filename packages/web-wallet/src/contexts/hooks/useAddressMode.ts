import { useState } from 'react';
import { loadAddressMode, saveAddressMode, getDisplayAddressForMode, type AddressMode } from '../../utils/addressMode';
import { readOnlyWalletService } from '../../services/ReadOnlyWalletService';

interface UseAddressModeOptions {
  onError: (error: string) => void;
  onAddressUpdate: (address: string) => void;
}

export function useAddressMode(options: UseAddressModeOptions) {
  const { onError, onAddressUpdate } = options;
  const [addressMode, setAddressModeState] = useState<AddressMode>(loadAddressMode().mode);

  const setAddressMode = async (mode: AddressMode) => {
    const saved = saveAddressMode(mode);
    if (!saved) {
      onError('Failed to save address mode preference. Your selection may not persist after page reload.');
    }

    setAddressModeState(mode);

    // Refresh the displayed address to reflect the new mode
    if (readOnlyWalletService.isReady()) {
      try {
        const address = await getDisplayAddressForMode(mode, readOnlyWalletService);
        onAddressUpdate(address);
      } catch (error) {
        console.error('Failed to refresh address after mode change:', error);
      }
    }
  };

  return {
    addressMode,
    setAddressMode,
  };
}
