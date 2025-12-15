import { useState } from 'react';
import { loadAddressMode, saveAddressMode, type AddressMode } from '../../utils/addressMode';

interface UseAddressModeOptions {
  onError: (error: string) => void;
  onAddressUpdate: (mode: AddressMode) => Promise<void>;
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

    // Let WalletContext handle wallet state check and address refresh
    try {
      await onAddressUpdate(mode);
    } catch (error) {
      console.error('Failed to refresh address after mode change:', error);
    }
  };

  return {
    addressMode,
    setAddressMode,
  };
}
