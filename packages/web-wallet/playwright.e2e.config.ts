import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import type { WalletSetup } from './tests/e2e/fixtures/metamask-fixture';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Minimal, dependency-free `.env.e2e` loader. Existing `process.env` values win, so a
 * value exported in the shell (or a CI secret) overrides the file.
 */
function loadEnvFile(file: string): void {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)\s*$/);
    if (!match || line.trim().startsWith('#')) continue;
    const [, key] = match;
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(resolve(here, '.env.e2e'));

// The dApp must load under an origin the Snap allows for `htr_getXpub` (see packages/snap
// RPC_RESTRICTIONS). The browser remaps this allowed origin to the local dev server via
// `--host-resolver-rules` (see fixtures/metamask-fixture.ts); the dev server itself listens on
// `https://localhost:5173` (TLS enabled by `E2E_TLS` in webpack.config.cjs).
const DAPP_ORIGIN = 'https://staging.wallet.hathor.network';
const WEB_WALLET_SERVER_URL = 'https://localhost:5173';
const SNAP_URL = 'http://localhost:8080';

/**
 * E2E suite that drives the real MetaMask Flask extension. Kept separate from the
 * lightweight `playwright.config.ts` connect-page smoke so the extension machinery and
 * its longer timeouts don't slow the basic suite.
 *
 * Loading a browser extension requires a persistent context, so the whole suite runs in
 * a single worker against one browser (see `fixtures/metamask-fixture.ts`).
 */
export default defineConfig<Record<string, never>, { walletSetup: WalletSetup }>({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // MetaMask onboarding + Snap install + on-chain calls are slow; be generous.
  timeout: 180_000,
  expect: { timeout: 30_000 },
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: DAPP_ORIGIN,
    // The dev server presents a self-signed cert; let Playwright-driven pages accept it
    // (the browser itself also gets `--ignore-certificate-errors` in the fixture).
    ignoreHTTPSErrors: true,
    // Bound every locator action. The default is 0 (no timeout), so a click on a not-yet-rendered
    // element hangs until the whole test times out — which is what happens on slower machines/CI
    // where MetaMask's onboarding UI lingers on its loading spinner. A generous bound lets actions
    // wait for rendering, but fail fast (and clearly) instead of consuming the 180s test budget.
    actionTimeout: 45_000,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },

  // One project per journey = one isolated MetaMask context (fresh userDataDir per worker).
  projects: [
    {
      name: 'onboarding',
      testMatch: 'onboarding.spec.ts',
      use: { walletSetup: { kind: 'onboard' } },
    },
    {
      name: 'import',
      testMatch: 'import.spec.ts',
      use: { walletSetup: { kind: 'import', wallet: 'funded' } },
    },
    {
      name: 'feature-example',
      testMatch: 'feature-example.spec.ts',
      use: { walletSetup: { kind: 'import', wallet: 'funded', network: 'testnet' } },
    },
    {
      name: 'token-lifecycle',
      testMatch: 'token-lifecycle.spec.ts',
      use: { walletSetup: { kind: 'import', wallet: 'funded' } },
    },
  ],

  // Boot both the local Snap and the web-wallet dev server before the tests run.
  webServer: [
    {
      // Use the E2E Snap config so the dev build does NOT rewrite the committed
      // snap.manifest.json (keeps packages/snap byte-identical to what is published).
      command: 'yarn workspace @hathor/snap exec mm-snap watch --config snap.config.e2e.ts',
      url: `${SNAP_URL}/snap.manifest.json`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      // `E2E_TLS=true` makes webpack-dev-server serve HTTPS (self-signed) and disables HMR, so
      // the dApp can load under the Snap-allowed `https://` origin in `baseURL` above.
      // `SNAP_TIMEOUT_MS` raises the dApp's snap RPC timeouts for E2E: a cold snap start (which
      // also starts a Hathor wallet) plus an approval dialog can exceed the 10s prod default on
      // slower machines/CI. Production builds leave it unset, keeping the 10s defaults.
      command: 'SNAP_TIMEOUT_MS=60000 E2E_TLS=true yarn dev',
      url: WEB_WALLET_SERVER_URL,
      ignoreHTTPSErrors: true,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
