import type { ReadOnlyWalletWrapper } from '../services/ReadOnlyWalletWrapper';
import { createLogger } from './logger';

const log = createLogger('addressMode');

export type AddressMode = 'single' | 'dynamic';

export const ADDRESS_MODE_STORAGE_KEY = 'hathor_wallet_address_mode';
export const DEFAULT_ADDRESS_MODE: AddressMode = 'single';

/**
 * Get address based on the selected address mode
 *
 * @param mode - 'single' for always using address at index 0, 'dynamic' for current unused address
 * @param readOnlyWalletWrapper - The wallet service instance
 * @returns The address string
 */
export async function getAddressForMode(
  mode: AddressMode,
  readOnlyWalletWrapper: ReadOnlyWalletWrapper
): Promise<string> {
  const { address } = await getAddressInfoForMode(mode, readOnlyWalletWrapper);
  return address;
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
    // Dynamic mode: get current unused address
    const addressInfo = readOnlyWalletWrapper.getCurrentAddress();
    if (!addressInfo) {
      throw new Error('Failed to get current address');
    }
    return {
      address: addressInfo.address,
      index: addressInfo.index,
    };
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
    log.error('Failed to load address mode from localStorage:', error);
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
    log.error('Failed to save address mode to localStorage:', error);
    return false;
  }
}
