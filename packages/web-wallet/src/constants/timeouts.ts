/**
 * Timeout constants for snap RPC operations and network operations.
 * All values are in milliseconds.
 *
 * The default is 10s. A build-time override (`SNAP_TIMEOUT_MS`, injected via webpack
 * DefinePlugin) raises ALL of these for environments where the snap is slow to respond — e.g.
 * E2E or slow CI runners, where a cold snap start (which also starts a Hathor wallet) plus an
 * approval dialog can exceed 10s. Normal builds leave it empty, so production behavior is
 * unchanged.
 */
const DEFAULT_TIMEOUT = 10000;
const overrideMs = Number(process.env.SNAP_TIMEOUT_MS);
const TIMEOUT = Number.isFinite(overrideMs) && overrideMs > 0 ? overrideMs : DEFAULT_TIMEOUT;

export const SNAP_TIMEOUTS = {
  /** Timeout for snap RPC calls like getXpub, changeNetwork, etc. */
  RPC_CALL: TIMEOUT,

  /** Timeout for network check operations */
  NETWORK_CHECK: TIMEOUT,

  /** Timeout for network change operations */
  NETWORK_CHANGE: TIMEOUT,

  /** Timeout for rollback operations after failed network change */
  ROLLBACK: TIMEOUT,

  /** Timeout for connection check on app initialization */
  CONNECTION_CHECK: TIMEOUT,
} as const;
