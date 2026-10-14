import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * `SNAP_TIMEOUT_MS` is a production-facing build-time knob (webpack DefinePlugin). It defaults to
 * empty, which MUST resolve to the shipped 10s. These tests pin that default so a future refactor
 * cannot silently change production behavior. The module reads the env at import time, so each
 * case re-imports against a fresh module registry.
 */
async function loadSnapTimeouts() {
  vi.resetModules();
  return (await import('../timeouts')).SNAP_TIMEOUTS;
}

describe('SNAP_TIMEOUTS default (SNAP_TIMEOUT_MS)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('resolves every timeout to the shipped 10s when SNAP_TIMEOUT_MS is empty', async () => {
    vi.stubEnv('SNAP_TIMEOUT_MS', '');
    const snapTimeouts = await loadSnapTimeouts();
    expect(Object.values(snapTimeouts).length).toBeGreaterThan(0);
    for (const value of Object.values(snapTimeouts)) {
      expect(value).toBe(10000);
    }
  });

  it('applies a valid positive override to every timeout', async () => {
    vi.stubEnv('SNAP_TIMEOUT_MS', '60000');
    const snapTimeouts = await loadSnapTimeouts();
    for (const value of Object.values(snapTimeouts)) {
      expect(value).toBe(60000);
    }
  });

  it.each(['0', '-5', 'abc'])('falls back to 10s for invalid SNAP_TIMEOUT_MS=%s', async (raw) => {
    vi.stubEnv('SNAP_TIMEOUT_MS', raw);
    const snapTimeouts = await loadSnapTimeouts();
    for (const value of Object.values(snapTimeouts)) {
      expect(value).toBe(10000);
    }
  });
});
