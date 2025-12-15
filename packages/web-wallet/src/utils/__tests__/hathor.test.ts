import { describe, it, expect } from 'vitest';
import { amountToCents, centsToAmount } from '../hathor';

describe('hathor utilities', () => {
  describe('amountToCents', () => {
    it('should convert whole HTR amounts correctly', () => {
      expect(amountToCents('1')).toBe(100n);
      expect(amountToCents('10')).toBe(1000n);
      expect(amountToCents('100')).toBe(10000n);
    });

    it('should convert decimal HTR amounts correctly', () => {
      expect(amountToCents('1.50')).toBe(150n);
      expect(amountToCents('0.01')).toBe(1n);
      expect(amountToCents('0.99')).toBe(99n);
      expect(amountToCents('123.45')).toBe(12345n);
    });

    it('should handle single decimal place', () => {
      expect(amountToCents('1.5')).toBe(150n);
      expect(amountToCents('0.1')).toBe(10n);
    });

    it('should handle zero', () => {
      expect(() => amountToCents('0')).toThrow('Amount must be greater than 0');
      expect(() => amountToCents('0.00')).toThrow('Amount must be greater than 0');
    });

    it('should reject negative amounts', () => {
      expect(() => amountToCents('-1')).toThrow('Invalid amount format');
      expect(() => amountToCents('-0.50')).toThrow('Invalid amount format');
    });

    it('should reject more than 2 decimal places', () => {
      expect(() => amountToCents('1.234')).toThrow('Invalid amount format');
      expect(() => amountToCents('0.001')).toThrow('Invalid amount format');
    });

    it('should reject invalid formats', () => {
      expect(() => amountToCents('abc')).toThrow('Invalid amount format');
      expect(() => amountToCents('1.2.3')).toThrow('Invalid amount format');
      expect(() => amountToCents('')).toThrow('Invalid amount format');
      expect(() => amountToCents('.')).toThrow('Invalid amount format');
    });

    it('should handle very large amounts without overflow', () => {
      // Test with large amounts that would overflow Number.MAX_SAFE_INTEGER
      const largeAmount = '9007199254740991.99'; // Close to Number.MAX_SAFE_INTEGER
      expect(amountToCents(largeAmount)).toBe(900719925474099199n);
    });

    it('should handle amounts with leading/trailing spaces', () => {
      expect(amountToCents('  1.50  ')).toBe(150n);
      expect(amountToCents('  10  ')).toBe(1000n);
    });

    it('should preserve precision for edge cases', () => {
      expect(amountToCents('0.01')).toBe(1n);
      expect(amountToCents('0.02')).toBe(2n);
      expect(amountToCents('0.10')).toBe(10n);
      expect(amountToCents('0.11')).toBe(11n);
    });

    it('should handle maximum 2-decimal precision correctly', () => {
      expect(amountToCents('99.99')).toBe(9999n);
      expect(amountToCents('100.99')).toBe(10099n);
    });
  });

  describe('centsToAmount', () => {
    it('should convert cents to HTR correctly', () => {
      expect(centsToAmount(100n)).toBe('1.00');
      expect(centsToAmount(1000n)).toBe('10.00');
      expect(centsToAmount(10000n)).toBe('100.00');
    });

    it('should handle fractional cents', () => {
      expect(centsToAmount(150n)).toBe('1.50');
      expect(centsToAmount(1n)).toBe('0.01');
      expect(centsToAmount(99n)).toBe('0.99');
      expect(centsToAmount(12345n)).toBe('123.45');
    });

    it('should handle zero', () => {
      expect(centsToAmount(0n)).toBe('0.00');
    });

    it('should handle single digit cents', () => {
      expect(centsToAmount(1n)).toBe('0.01');
      expect(centsToAmount(5n)).toBe('0.05');
      expect(centsToAmount(9n)).toBe('0.09');
    });

    it('should handle very large amounts', () => {
      const largeCents = 900719925474099199n;
      expect(centsToAmount(largeCents)).toBe('9007199254740991.99');
    });

    it('should always show 2 decimal places', () => {
      expect(centsToAmount(100n)).toBe('1.00');
      expect(centsToAmount(1050n)).toBe('10.50');
      expect(centsToAmount(10n)).toBe('0.10');
    });
  });



  describe('round-trip conversion', () => {
    it('should preserve values through amountToCents -> centsToAmount', () => {
      const testValues = ['1.00', '10.50', '0.01', '99.99', '123.45'];

      testValues.forEach(value => {
        const cents = amountToCents(value);
        const backToHTR = centsToAmount(cents);
        expect(backToHTR).toBe(value.includes('.') ? value : `${value}.00`);
      });
    });

    it('should handle edge case amounts in round trip', () => {
      const edgeCases = ['0.01', '0.99', '1.00', '999.99', '1000.00'];

      edgeCases.forEach(value => {
        const cents = amountToCents(value);
        const backToHTR = centsToAmount(cents);
        expect(backToHTR).toBe(value);
      });
    });
  });

  describe('overflow protection', () => {
    it('should handle amounts beyond Number.MAX_SAFE_INTEGER', () => {
      // BigInt can handle arbitrarily large values
      const veryLarge = '99999999999999999.99';
      const cents = amountToCents(veryLarge);
      expect(cents).toBe(9999999999999999999n);

      const backToHTR = centsToAmount(cents);
      expect(backToHTR).toBe(veryLarge);
    });

    it('should not lose precision with large numbers', () => {
      const largeAmount = '1234567890.12';
      const cents = amountToCents(largeAmount);
      const backToHTR = centsToAmount(cents);
      expect(backToHTR).toBe(largeAmount);
    });
  });

  describe('validation error messages', () => {
    it('should provide clear error for invalid format', () => {
      expect(() => amountToCents('abc')).toThrow('Invalid amount format');
    });

    it('should provide clear error for zero amount', () => {
      expect(() => amountToCents('0')).toThrow('Amount must be greater than 0');
    });

    it('should provide clear error for too many decimals', () => {
      expect(() => amountToCents('1.234')).toThrow('Invalid amount format. Use up to 2 decimal places.');
    });
  });
});
