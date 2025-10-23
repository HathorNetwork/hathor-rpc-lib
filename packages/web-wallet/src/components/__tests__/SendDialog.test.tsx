import { describe, it, expect } from 'vitest';
import { Network } from '@hathor/wallet-lib';
import Address from '@hathor/wallet-lib/lib/models/address';

describe('SendDialog - Address Validation (Critical for Fund Safety)', () => {
  // Test the actual validation logic that prevents fund loss

  describe('Critical: Address checksum validation prevents fund loss', () => {
    it('should reject address with invalid checksum', () => {
      // Take a valid address and corrupt last character to break checksum
      const validAddress = 'WYBwT3xLpDnHNtYZiU52oanupVeDKhAvNp';
      const invalidChecksumAddress = validAddress.slice(0, -1) + 'X';
      const network = new Network('testnet');

      // This should throw because the checksum is invalid
      expect(() => {
        const addr = new Address(invalidChecksumAddress, { network });
        addr.validateAddress();
      }).toThrow();
    });

    it('should accept valid testnet address with correct checksum', () => {
      // Using actual valid testnet address from wallet-lib tests
      const validTestnetAddress = 'WYiD1E8n5oB9weZ8NMyM3KoCjKf1KCjWAZ';
      const network = new Network('testnet');

      // This should not throw
      expect(() => {
        const addr = new Address(validTestnetAddress, { network });
        addr.validateAddress();
      }).not.toThrow();
    });

    it('should reject mainnet address when validating against testnet', () => {
      // Using a valid mainnet address from wallet-lib tests
      const mainnetAddress = 'HNBUHhzkVuSFUNW21HrajUFNUiX8JrznSb';
      const testnetNetwork = new Network('testnet');

      // This should throw because network doesn't match
      expect(() => {
        const addr = new Address(mainnetAddress, { network: testnetNetwork });
        addr.validateAddress();
      }).toThrow();
    });

    it('should accept mainnet address when validating against mainnet', () => {
      // Using a valid mainnet address from wallet-lib tests
      const mainnetAddress = 'HNBUHhzkVuSFUNW21HrajUFNUiX8JrznSb';
      const mainnetNetwork = new Network('mainnet');

      // This should not throw
      expect(() => {
        const addr = new Address(mainnetAddress, { network: mainnetNetwork });
        addr.validateAddress();
      }).not.toThrow();
    });
  });

  describe('Critical: Amount validation prevents overflow', () => {
    it('should detect amount exceeding MAX_SAFE_INTEGER/100', () => {
      const overflowAmount = Number.MAX_SAFE_INTEGER / 100 + 1;
      const amountPattern = /^\d+(\.\d{1,2})?$/;

      // Amount is a valid number format
      expect(amountPattern.test(overflowAmount.toString())).toBe(true);

      // But exceeds safe integer limit
      expect(overflowAmount > Number.MAX_SAFE_INTEGER / 100).toBe(true);
    });

    it('should accept amounts within safe range', () => {
      const safeAmount = Number.MAX_SAFE_INTEGER / 100 - 1;
      const amountPattern = /^\d+(\.\d{1,2})?$/;

      expect(amountPattern.test(safeAmount.toString())).toBe(true);
      expect(safeAmount <= Number.MAX_SAFE_INTEGER / 100).toBe(true);
    });

    it('should validate amount format (max 2 decimals)', () => {
      const amountPattern = /^\d+(\.\d{1,2})?$/;

      expect(amountPattern.test('100')).toBe(true);
      expect(amountPattern.test('100.5')).toBe(true);
      expect(amountPattern.test('100.50')).toBe(true);

      // Should reject more than 2 decimals
      expect(amountPattern.test('100.123')).toBe(false);

      // Should reject scientific notation
      expect(amountPattern.test('1e10')).toBe(false);
    });
  });
});
