import type { ReadOnlyWalletWrapper } from '../services/ReadOnlyWalletWrapper';

export type AddressMode = 'single' | 'dynamic';

export const ADDRESS_MODE_STORAGE_KEY = 'hathor_wallet_address_mode';
export const DEFAULT_ADDRESS_MODE: AddressMode = 'dynamic';

/**
 * Get address based on the selected address mode
 *
 * @param mode - 'single' for always using address at index 0, 'dynamic' for generating new addresses
 * @param readOnlyWalletWrapper - The wallet service instance
 * @returns The address string
 */
export async function getAddressForMode(
  mode: AddressMode,
  readOnlyWalletWrapper: ReadOnlyWalletWrapper
): Promise<string> {
  if (mode === 'single') {
    // Always use address at index 0
    const addressInfo = await readOnlyWalletWrapper.getAddressAtIndex(0);
    if (!addressInfo) {
      throw new Error('Failed to get address at index 0');
    }
    return addressInfo.address;
  } else {
    // Dynamic mode: get next available address
    const addressInfo = readOnlyWalletWrapper.getNextAddress();
    return addressInfo.address;
  }
}

/**
 * Get address info (address + index) based on the selected address mode
 *
 * @param mode - 'single' for always using address at index 0, 'dynamic' for generating new addresses
 * @param readOnlyWalletWrapper - The wallet service instance
 * @returns Object with address and index
 */
export async function getAddressInfoForMode(
  mode: AddressMode,
  readOnlyWalletWrapper: ReadOnlyWalletWrapper
): Promise<{ address: string; index: number }> {
  if (mode === 'single') {
    // Always use address at index 0
    const addressInfo = await readOnlyWalletWrapper.getAddressAtIndex(0);
    if (!addressInfo) {
      throw new Error('Failed to get address at index 0');
    }
    return { address: addressInfo.address, index: 0 };
  } else {
    // Dynamic mode: get next available address
    const addressInfo = readOnlyWalletWrapper.getNextAddress();
    return {
      address: addressInfo.address,
      index: addressInfo.index,
    };
  }
}

/**
 * Get address for display purposes based on the selected address mode.
 * Unlike getAddressForMode, this does NOT mark addresses as used in dynamic mode.
 *
 * @param mode - 'single' for always using address at index 0, 'dynamic' for showing current address
 * @param readOnlyWalletWrapper - The wallet service instance
 * @returns The address string
 */
export async function getDisplayAddressForMode(
  mode: AddressMode,
  readOnlyWalletWrapper: ReadOnlyWalletWrapper
): Promise<string> {
  if (mode === 'single') {
    // Always use address at index 0
    const addressInfo = await readOnlyWalletWrapper.getAddressAtIndex(0);
    if (!addressInfo) {
      throw new Error('Failed to get address at index 0');
    }
    return addressInfo.address;
  } else {
    // Dynamic mode: get current address WITHOUT marking as used
    const addressInfo = readOnlyWalletWrapper.getCurrentAddress();
    if (!addressInfo) {
      throw new Error('Failed to get current address');
    }
    return addressInfo.address;
  }
}

/**
 * Load address mode from localStorage
 *
 * @returns Object with mode and optional error message
 */
export function loadAddressMode(): { mode: AddressMode; error?: string } {
  try {
    const stored = localStorage.getItem(ADDRESS_MODE_STORAGE_KEY);
    if (stored === 'single' || stored === 'dynamic') {
      return { mode: stored };
    }
    return { mode: DEFAULT_ADDRESS_MODE };
  } catch (error) {
    console.error('Failed to load address mode from localStorage:', error);
    return {
      mode: DEFAULT_ADDRESS_MODE,
      error: 'Failed to load address preference'
    };
  }
}

/**
 * Save address mode to localStorage
 *
 * @param mode - The address mode to save
 * @returns true if save was successful, false otherwise
 */
export function saveAddressMode(mode: AddressMode): boolean {
  try {
    localStorage.setItem(ADDRESS_MODE_STORAGE_KEY, mode);
    return true;
  } catch (error) {
    console.error('Failed to save address mode to localStorage:', error);
    return false;
  }
}
