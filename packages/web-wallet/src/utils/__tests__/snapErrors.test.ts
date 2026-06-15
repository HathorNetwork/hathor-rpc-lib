import { describe, it, expect, vi } from 'vitest';

// Mock @hathor/wallet-lib so we don't pull in the full wallet runtime just to
// resolve `constants.NATIVE_TOKEN_UID` and the `TokenVersion` enum.
vi.mock('@hathor/wallet-lib', () => ({
  constants: {
    NATIVE_TOKEN_UID: '00',
  },
  TokenVersion: {
    NATIVE: 0,
    DEPOSIT: 1,
    FEE: 2,
  },
}));

import { TokenVersion } from '@hathor/wallet-lib';
import {
  getSnapErrorUserMessage,
  isHtrUtxoShortage,
  isTokenUtxoShortage,
  extractErrorMessage,
  isSnapCrashedError,
  isSnapNotInstalledError,
  isSnapDisabledError,
  isUnauthorizedError,
} from '../snapErrors';

describe('snapErrors', () => {
  describe('isHtrUtxoShortage', () => {
    it('returns true for the canonical HTR shortage message anchored on a period', () => {
      expect(
        isHtrUtxoShortage('No UTXOs available for the token 00.')
      ).toBe(true);
    });

    it('returns true when the HTR shortage message is embedded in a longer error', () => {
      expect(
        isHtrUtxoShortage('SendTxError: No UTXOs available for the token 00. extra context')
      ).toBe(true);
    });

    it('returns false for a custom token whose UID starts with the HTR prefix', () => {
      expect(
        isHtrUtxoShortage('No UTXOs available for the token 00abc.')
      ).toBe(false);
    });

    it('returns false for a generic custom-token shortage', () => {
      expect(
        isHtrUtxoShortage('No UTXOs available for the token abc123.')
      ).toBe(false);
    });

    it('returns false for unrelated messages', () => {
      expect(isHtrUtxoShortage('Something went wrong')).toBe(false);
      expect(isHtrUtxoShortage('')).toBe(false);
    });
  });

  describe('isTokenUtxoShortage', () => {
    it('returns true for a custom-token shortage', () => {
      expect(
        isTokenUtxoShortage('No UTXOs available for the token abc123.')
      ).toBe(true);
    });

    it('returns true when the custom token UID starts with the HTR prefix', () => {
      // Prefix collision: must NOT be misclassified as HTR.
      expect(
        isTokenUtxoShortage('No UTXOs available for the token 00abc.')
      ).toBe(true);
    });

    it('returns false for an HTR shortage', () => {
      expect(
        isTokenUtxoShortage('No UTXOs available for the token 00.')
      ).toBe(false);
    });

    it('returns false for unrelated messages', () => {
      expect(isTokenUtxoShortage('Insufficient HTR')).toBe(false);
      expect(isTokenUtxoShortage('')).toBe(false);
    });
  });

  describe('getSnapErrorUserMessage', () => {
    it('routes HTR shortage to the network-fee message by default', () => {
      expect(
        getSnapErrorUserMessage('No UTXOs available for the token 00.')
      ).toBe('Insufficient HTR to cover the network fee.');
    });

    it('routes HTR shortage to a transfer-balance message for NATIVE', () => {
      expect(
        getSnapErrorUserMessage('No UTXOs available for the token 00.', {
          tokenVersion: TokenVersion.NATIVE,
        })
      ).toBe('Insufficient balance to send this transaction.');
    });

    it('routes HTR shortage to a deposit message for DEPOSIT', () => {
      expect(
        getSnapErrorUserMessage('No UTXOs available for the token 00.', {
          tokenVersion: TokenVersion.DEPOSIT,
        })
      ).toBe('Insufficient HTR balance for deposit.');
    });

    it('routes HTR shortage to the network-fee message for FEE', () => {
      expect(
        getSnapErrorUserMessage('No UTXOs available for the token 00.', {
          tokenVersion: TokenVersion.FEE,
        })
      ).toBe('Insufficient HTR to cover the network fee.');
    });

    it('ignores context for non-HTR custom-token shortages', () => {
      expect(
        getSnapErrorUserMessage('No UTXOs available for the token abc123.', {
          tokenVersion: TokenVersion.NATIVE,
        })
      ).toBe('Insufficient balance to send this transaction.');
    });

    it('routes custom-token shortage to the generic insufficient-balance message', () => {
      expect(
        getSnapErrorUserMessage('No UTXOs available for the token abc123.')
      ).toBe('Insufficient balance to send this transaction.');
    });

    it('routes a custom-token shortage whose UID starts with "00" as a custom token, not HTR', () => {
      // Regression: substring match would have classified this as HTR.
      expect(
        getSnapErrorUserMessage('No UTXOs available for the token 00abc.')
      ).toBe('Insufficient balance to send this transaction.');
    });

    it('routes a snap crash (DataCloneError) to the friendly crash message', () => {
      expect(
        getSnapErrorUserMessage('DataCloneError: failed to clone snap response')
      ).toBe('MetaMask Snap is not responding. Please refresh the page and try again.');
    });

    it('routes a snap timeout to the friendly crash message', () => {
      expect(getSnapErrorUserMessage('Request timeout after 30s')).toBe(
        'MetaMask Snap is not responding. Please refresh the page and try again.'
      );
    });

    it('routes a snap-not-installed error to the connect-wallet message', () => {
      expect(getSnapErrorUserMessage('Snap not installed')).toBe(
        'Snap not installed. Please connect your wallet.'
      );
      expect(getSnapErrorUserMessage('Snap not found')).toBe(
        'Snap not installed. Please connect your wallet.'
      );
    });

    it('routes a blocked snap to the blocked message', () => {
      expect(getSnapErrorUserMessage('Snap is blocked by MetaMask')).toBe(
        'Snap is blocked. Please enable it in MetaMask settings.'
      );
    });

    it('routes a disabled snap (without "blocked") to the disabled message', () => {
      expect(getSnapErrorUserMessage('Snap is disabled')).toBe(
        'Snap is disabled. Please enable it in MetaMask settings.'
      );
    });

    it('passes through an unrecognised message unchanged', () => {
      expect(getSnapErrorUserMessage('Something weird happened')).toBe(
        'Something weird happened'
      );
    });

    it('falls back to a generic message for an empty string', () => {
      expect(getSnapErrorUserMessage('')).toBe('An unknown error occurred');
    });
  });

  describe('extractErrorMessage', () => {
    it('extracts the message from an Error instance', () => {
      const err = new Error('boom');
      expect(extractErrorMessage(err, 'fallback')).toBe('boom');
    });

    it('falls back when the Error has an empty message', () => {
      const err = new Error('');
      expect(extractErrorMessage(err, 'fallback')).toBe('fallback');
    });

    it('extracts the message from a JSON-RPC-style object', () => {
      const err = { code: -32000, message: 'rpc error message' };
      expect(extractErrorMessage(err, 'fallback')).toBe('rpc error message');
    });

    it('falls back when the object message is an empty string', () => {
      const err = { message: '' };
      expect(extractErrorMessage(err, 'fallback')).toBe('fallback');
    });

    it('falls back when the object message is not a string', () => {
      const err = { message: 42 };
      expect(extractErrorMessage(err, 'fallback')).toBe('fallback');
    });

    it('falls back for undefined', () => {
      expect(extractErrorMessage(undefined, 'fallback')).toBe('fallback');
    });

    it('falls back for null', () => {
      expect(extractErrorMessage(null, 'fallback')).toBe('fallback');
    });

    it('falls back for a plain string (no .message property)', () => {
      expect(extractErrorMessage('raw string error', 'fallback')).toBe('fallback');
    });

    it('falls back for a number', () => {
      expect(extractErrorMessage(123, 'fallback')).toBe('fallback');
    });
  });

  describe('isSnapCrashedError', () => {
    it('detects DataCloneError', () => {
      expect(isSnapCrashedError('DataCloneError: bad clone')).toBe(true);
    });

    it('detects postMessage failures', () => {
      expect(isSnapCrashedError('postMessage failed')).toBe(true);
    });

    it('detects cloned errors', () => {
      expect(isSnapCrashedError('object could not be cloned')).toBe(true);
    });

    it('detects timeouts', () => {
      expect(isSnapCrashedError('Network check timeout')).toBe(true);
    });

    it('returns false for unrelated messages', () => {
      expect(isSnapCrashedError('Insufficient balance')).toBe(false);
    });
  });

  describe('isSnapNotInstalledError', () => {
    it('detects "not installed"', () => {
      expect(isSnapNotInstalledError('Snap is not installed')).toBe(true);
    });

    it('detects "Snap not found"', () => {
      expect(isSnapNotInstalledError('Snap not found')).toBe(true);
    });

    it('returns false for unrelated messages', () => {
      expect(isSnapNotInstalledError('blocked by user')).toBe(false);
    });
  });

  describe('isSnapDisabledError', () => {
    it('detects "blocked"', () => {
      expect(isSnapDisabledError('Snap is blocked')).toBe(true);
    });

    it('detects "disabled"', () => {
      expect(isSnapDisabledError('Snap is disabled')).toBe(true);
    });

    it('returns false for unrelated messages', () => {
      expect(isSnapDisabledError('not installed')).toBe(false);
    });
  });

  describe('isUnauthorizedError', () => {
    it('returns true for error code 4100', () => {
      expect(isUnauthorizedError({ code: 4100 })).toBe(true);
    });

    it('returns true for "Unauthorized" in message', () => {
      expect(isUnauthorizedError({ message: 'Unauthorized request' })).toBe(true);
    });

    it('returns true for "permission" in message', () => {
      expect(isUnauthorizedError({ message: 'missing permission' })).toBe(true);
    });

    it('returns false for non-matching messages', () => {
      expect(isUnauthorizedError({ message: 'something else' })).toBe(false);
    });

    it('returns false for non-object values', () => {
      expect(isUnauthorizedError(null)).toBe(false);
      expect(isUnauthorizedError(undefined)).toBe(false);
      expect(isUnauthorizedError('Unauthorized')).toBe(false);
    });
  });
});
