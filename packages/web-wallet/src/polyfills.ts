// Browser polyfills for Node.js globals
import { Buffer } from 'buffer';
// @ts-ignore - No type definitions available for process/browser
import process from 'process/browser';

// Make Buffer available globally
(window as any).Buffer = Buffer;
(globalThis as any).Buffer = Buffer;

// Make process available globally
(window as any).process = process;
(globalThis as any).process = process;

// Export for explicit imports
export { Buffer, process };
