import type { ReadOnlyWalletService } from '../services/ReadOnlyWalletService';

export type AddressMode = 'single' | 'dynamic';

export const ADDRESS_MODE_STORAGE_KEY = 'hathor_wallet_address_mode';
export const DEFAULT_ADDRESS_MODE: AddressMode = 'dynamic';

/**
 * Get address based on the selected address mode
 *
 * @param mode - 'single' for always using address at index 0, 'dynamic' for generating new addresses
 * @param readOnlyWalletService - The wallet service instance
 * @returns The address string
 */
export async function getAddressForMode(
  mode: AddressMode,
  readOnlyWalletService: ReadOnlyWalletService
): Promise<string> {
  if (mode === 'single') {
    // Always use address at index 0
    const addressInfo = await readOnlyWalletService.getAddressAtIndex(0);
    if (!addressInfo) {
      throw new Error('Failed to get address at index 0');
    }
    return addressInfo.address;
  } else {
    // Dynamic mode: get next available address
    const addressInfo = readOnlyWalletService.getNextAddress();
    return addressInfo.address;
  }
}

/**
 * Get address info (address + index) based on the selected address mode
 *
 * @param mode - 'single' for always using address at index 0, 'dynamic' for generating new addresses
 * @param readOnlyWalletService - The wallet service instance
 * @returns Object with address and index
 */
export async function getAddressInfoForMode(
  mode: AddressMode,
  readOnlyWalletService: ReadOnlyWalletService
): Promise<{ address: string; index: number }> {
  if (mode === 'single') {
    // Always use address at index 0
    const addressInfo = await readOnlyWalletService.getAddressAtIndex(0);
    if (!addressInfo) {
      throw new Error('Failed to get address at index 0');
    }
    return { address: addressInfo.address, index: 0 };
  } else {
    // Dynamic mode: get next available address
    const addressInfo = readOnlyWalletService.getNextAddress();
    return {
      address: addressInfo.address,
      index: addressInfo.index,
    };
  }
}

/**
 * Load address mode from localStorage
 *
 * @returns The stored address mode or default if not found
 */
export function loadAddressMode(): AddressMode {
  try {
    const stored = localStorage.getItem(ADDRESS_MODE_STORAGE_KEY);
    if (stored === 'single' || stored === 'dynamic') {
      return stored;
    }
  } catch (error) {
    console.error('Failed to load address mode from localStorage:', error);
  }
  return DEFAULT_ADDRESS_MODE;
}

/**
 * Save address mode to localStorage
 *
 * @param mode - The address mode to save
 */
export function saveAddressMode(mode: AddressMode): void {
  try {
    localStorage.setItem(ADDRESS_MODE_STORAGE_KEY, mode);
  } catch (error) {
    console.error('Failed to save address mode to localStorage:', error);
  }
}
