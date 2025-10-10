// Browser polyfills for Node.js globals
import { Buffer } from 'buffer';

// Make Buffer available globally
(window as any).Buffer = Buffer;
(globalThis as any).Buffer = Buffer;

// Export for explicit imports
export { Buffer };
