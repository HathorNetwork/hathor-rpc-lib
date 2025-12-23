import { describe, it, expect } from 'vitest';
import { compareVersions, isVersionSupported } from '../version';

describe('version utilities', () => {
  describe('compareVersions', () => {
    it('should return 0 for equal versions', () => {
      expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
      expect(compareVersions('0.0.0', '0.0.0')).toBe(0);
    });

    it('should return negative when first version is lower', () => {
      expect(compareVersions('1.2.3', '1.2.4')).toBeLessThan(0);
      expect(compareVersions('1.2.3', '2.0.0')).toBeLessThan(0);
      expect(compareVersions('0.1.0', '0.2.0')).toBeLessThan(0);
    });

    it('should return positive when first version is higher', () => {
      expect(compareVersions('1.2.4', '1.2.3')).toBeGreaterThan(0);
      expect(compareVersions('2.0.0', '1.9.9')).toBeGreaterThan(0);
      expect(compareVersions('0.3.0', '0.2.9')).toBeGreaterThan(0);
    });

    it('should handle versions with different number of parts', () => {
      expect(compareVersions('1.0', '1.0.0')).toBe(0);
      expect(compareVersions('1', '1.0.0')).toBe(0);
      expect(compareVersions('1.0', '1.0.1')).toBeLessThan(0);
    });

    it('should handle major version differences', () => {
      expect(compareVersions('2.0.0', '1.9.9')).toBeGreaterThan(0);
      expect(compareVersions('1.0.0', '2.0.0')).toBeLessThan(0);
    });
  });

  describe('isVersionSupported', () => {
    it('should return true when installed version meets minimum', () => {
      expect(isVersionSupported('1.0.0', '1.0.0')).toBe(true);
      expect(isVersionSupported('1.0.1', '1.0.0')).toBe(true);
      expect(isVersionSupported('2.0.0', '1.0.0')).toBe(true);
    });

    it('should return false when installed version is below minimum', () => {
      expect(isVersionSupported('0.9.9', '1.0.0')).toBe(false);
      expect(isVersionSupported('1.0.0', '1.0.1')).toBe(false);
      expect(isVersionSupported('1.5.0', '2.0.0')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isVersionSupported('0.0.0', '0.0.0')).toBe(true);
      expect(isVersionSupported('0.0.1', '0.0.0')).toBe(true);
      expect(isVersionSupported('0.0.0', '0.0.1')).toBe(false);
    });

    it('should work with the default MIN_SNAP_VERSION', () => {
      // Default is '0.0.0', so any version should be supported
      expect(isVersionSupported('0.1.0', '0.0.0')).toBe(true);
      expect(isVersionSupported('1.0.0', '0.0.0')).toBe(true);
      expect(isVersionSupported('99.99.99', '0.0.0')).toBe(true);
    });
  });
});
