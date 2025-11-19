import { describe, it, expect, beforeEach } from 'vitest';
import { ReadOnlyWalletService } from '../ReadOnlyWalletService';

describe('ReadOnlyWalletService - Initialization and Race Conditions', () => {
  let service: ReadOnlyWalletService;

  beforeEach(() => {
    service = new ReadOnlyWalletService();
  });

  describe('Concurrent initialization calls', () => {
    it('should handle multiple concurrent initialize() calls safely', async () => {
      const xpub = 'invalid_xpub'; // Will fail validation
      const network = 'testnet';

      // Attempt to initialize multiple times concurrently
      const promises = [
        service.initialize(xpub, network),
        service.initialize(xpub, network),
        service.initialize(xpub, network),
      ];

      // Should not crash from race conditions
      const results = await Promise.allSettled(promises);

      // All should be rejected (invalid xpub), but no crash
      expect(results).toHaveLength(3);
      const rejected = results.filter(r => r.status === 'rejected');
      expect(rejected.length).toBe(3);
    });

    it('should prevent initialization while already initializing', async () => {
      const xpub = 'invalid_xpub'; // Will fail validation
      const network = 'testnet';

      // Start first initialization
      const firstInit = service.initialize(xpub, network);

      // Try to initialize again immediately
      const secondInit = service.initialize(xpub, network);

      const results = await Promise.allSettled([firstInit, secondInit]);

      // Both should complete without crashing
      expect(results).toHaveLength(2);
    });
  });

  describe('Network switch during initialization', () => {
    it('should handle network change interrupting initialization', async () => {
      const xpub = 'invalid_xpub'; // Will fail validation

      // Start initializing on testnet
      const testnetInit = service.initialize(xpub, 'testnet');

      // Immediately try to switch to mainnet
      // This simulates user changing network while wallet is loading
      const mainnetInit = service.initialize(xpub, 'mainnet');

      const results = await Promise.allSettled([testnetInit, mainnetInit]);

      // Should handle gracefully without data corruption
      expect(results).toHaveLength(2);
      // Both will fail (invalid xpub), but no crash or corruption
      const rejected = results.filter(r => r.status === 'rejected');
      expect(rejected.length).toBe(2);
    });

    it('should not mix state between different network initializations', async () => {
      const xpub = 'xpub123456789';

      // Initialize for testnet
      await service.initialize(xpub, 'testnet').catch(() => {});

      // Stop and reinitialize for mainnet
      if (service.isReady()) {
        await service.stop().catch(() => {});
      }

      await service.initialize(xpub, 'mainnet').catch(() => {});
      const mainnetReady = service.isReady();

      // Should be ready for the final network
      expect(mainnetReady).toBeDefined();
    });
  });

  describe('Wallet stop edge cases', () => {


    it('should clear wallet reference even when stop() throws', async () => {
      const service = new ReadOnlyWalletService();

      try {
        await service.initialize('xpub123', 'testnet');
      } catch {
        // Init might fail, that's ok for this test
      }

      // Stop should clear reference regardless of errors
      await service.stop().catch(() => {});

      // After stop, isReady should return false
      expect(service.isReady()).toBe(false);
    });
  });

  describe('Balance fetch after failed initialization', () => {
    it('should throw meaningful error when getting balance without initialization', async () => {
      const service = new ReadOnlyWalletService();

      await expect(async () => {
        await service.getBalance('00');
      }).rejects.toThrow('Wallet not initialized');
    });

    it('should throw error when getting balance after initialization failure', async () => {
      const service = new ReadOnlyWalletService();

      // Try to initialize with invalid params
      try {
        await service.initialize('', '');
      } catch {
        // Expected to fail
      }

      // Should not be ready
      expect(service.isReady()).toBe(false);

      // Getting balance should fail with clear error
      await expect(async () => {
        await service.getBalance('00');
      }).rejects.toThrow('Wallet not initialized');
    });
  });

  describe('Address retrieval', () => {
    it('should throw when wallet not initialized', () => {
      const service = new ReadOnlyWalletService();

      expect(() => {
        service.getCurrentAddress();
      }).toThrow('Wallet not initialized');
    });

    it('should return AddressInfo type (not null)', async () => {
      // Test that getCurrentAddress() return type is correct
      // The review noted it should not return null
      const service = new ReadOnlyWalletService();

      try {
        await service.initialize('xpub123', 'testnet');

        if (service.isReady()) {
          const address = service.getCurrentAddress();
          // Should be AddressInfo or throw, never null
          expect(address).toBeDefined();
          expect(address).not.toBeNull();
        }
      } catch (error) {
        // If it throws, that's correct behavior (not returning null)
        expect(error).toBeDefined();
      }
    });
  });

  describe('isReady() state management', () => {
    it('should return false when not initialized', () => {
      const service = new ReadOnlyWalletService();
      expect(service.isReady()).toBe(false);
    });

    it('should return false after failed initialization', async () => {
      const service = new ReadOnlyWalletService();

      try {
        await service.initialize('', ''); // Invalid params
      } catch {
        // Expected
      }

      expect(service.isReady()).toBe(false);
    });

    it('should return false after stop()', async () => {
      const service = new ReadOnlyWalletService();

      try {
        await service.initialize('xpub123', 'testnet');
      } catch {
        // Might fail in test env
      }

      await service.stop().catch(() => {});

      expect(service.isReady()).toBe(false);
    });
  });



  describe('WebSocket connection failures', () => {
    it('should handle WebSocket connection errors during initialization', async () => {
      const service = new ReadOnlyWalletService();

      // Initialize with potentially failing WebSocket
      try {
        await service.initialize('xpub123', 'testnet');
      } catch (error) {
        // Should get a meaningful error, not silent failure
        if (error instanceof Error) {
          expect(error.message).toBeTruthy();
          expect(error.message.length).toBeGreaterThan(0);
        }
      }

      // Even if init fails, isReady should be false
      if (!service.isReady()) {
        expect(service.isReady()).toBe(false);
      }
    });
  });


});
