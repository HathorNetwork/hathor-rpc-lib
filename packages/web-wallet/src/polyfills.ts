// Browser polyfills for Node.js globals
// Note: webpack's NodePolyfillPlugin handles Buffer and process globals automatically
// We only need to re-export them for explicit imports
import { Buffer } from 'buffer';
// @ts-expect-error - No type definitions available for process/browser
import process from 'process/browser';

// Extend Window and GlobalThis interfaces for TypeScript
declare global {
  interface Window {
    Buffer: typeof Buffer;
    process: typeof process;
  }
}

// LavaMoat's lockdown freezes globalThis, so we cannot mutate it
// The NodePolyfillPlugin already makes these available globally
// We only export them here for explicit imports

// Export for explicit imports
export { Buffer, process };
