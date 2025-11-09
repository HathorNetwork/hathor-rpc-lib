/**
 * Timeout constants for snap RPC operations and network operations.
 * All values are in milliseconds.
 */
export const SNAP_TIMEOUTS = {
  /** Timeout for snap RPC calls like getXpub, changeNetwork, etc. */
  RPC_CALL: 10000,

  /** Timeout for network check operations */
  NETWORK_CHECK: 10000,

  /** Timeout for network change operations */
  NETWORK_CHANGE: 10000,

  /** Timeout for rollback operations after failed network change */
  ROLLBACK: 10000,

  /** Timeout for connection check on app initialization */
  CONNECTION_CHECK: 10000,
} as const;
