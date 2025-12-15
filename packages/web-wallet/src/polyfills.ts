// Browser polyfills for Node.js globals
import { Buffer } from 'buffer';
// @ts-expect-error - No type definitions available for process/browser
import process from 'process/browser';

// Extend Window and GlobalThis interfaces
declare global {
  interface Window {
    Buffer: typeof Buffer;
    process: typeof process;
  }
}

// Make Buffer available globally
(window as Window & typeof globalThis).Buffer = Buffer;
(globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;

// Make process available globally
(window as Window & typeof globalThis).process = process;
(globalThis as typeof globalThis & { process: typeof process }).process = process;

// Export for explicit imports
export { Buffer, process };
