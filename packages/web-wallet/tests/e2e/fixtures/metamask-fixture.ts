import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveFlaskPath } from '../driver/flask';
import { MetaMaskDriver } from '../driver/MetaMaskDriver';
import {
  SPLIT_WINDOWS,
  closeStrayBlankPages,
  dumpWindows,
  openPageInNewWindow,
  tileSideBySide,
  waitForMetaMaskPage,
} from '../driver/windows';
import { WebWallet } from '../helpers/webWallet';
import {
  provisionImportedWallet,
  provisionNewWallet,
  type Network,
} from '../helpers/journeys';
import { lookupWallet } from '../helpers/wallets';

/**
 * How a journey's wallet is provisioned. Set per Playwright project via `use.walletSetup`:
 *   { kind: 'onboard' }                                        -> fresh wallet, zero funds
 *   { kind: 'import', wallet: 'funded', network?: 'testnet' }  -> import a named config wallet
 */
export type WalletSetup =
  | { kind: 'onboard' }
  | { kind: 'import'; wallet: string; network?: Network };

type MetaMaskWorkerOptions = {
  walletSetup: WalletSetup;
};

type MetaMaskWorkerFixtures = {
  /** Persistent browser context with MetaMask Flask loaded (worker-scoped). */
  mmContext: BrowserContext;
  /** Driver for the MetaMask extension (worker-scoped). */
  metamask: MetaMaskDriver;
  /** The dApp (web-wallet) page, shared across the worker's serial journey. */
  dappPage: Page;
  /** A connected WebWallet, provisioned once per worker from `walletSetup`. */
  wallet: WebWallet;
};

/**
 * Loading a Chromium extension requires a *persistent* context, and MetaMask keeps state
 * (the onboarded wallet, installed Snap) across tests. So these fixtures are
 * **worker-scoped**: each Playwright project runs in its own worker and therefore gets a
 * fresh `userDataDir` (fresh wallet). A journey provisions once and runs as a serial spec.
 *
 * Note: the built-in `context`/`page` fixtures are test-scoped and reserved, so we expose
 * our own worker-scoped `mmContext`/`dappPage` instead of overriding them.
 */
// `Record<never, never>` = "no test-scoped fixtures". NOT `Record<string, never>`: that has a
// `[x: string]: never` index signature which, once intersected with the worker fixtures, collapses
// every fixture (e.g. `walletSetup`) to `never` and breaks `extend`'s typing. `{}` would trip the
// `no-empty-object-type` lint rule, so use `Record<never, never>`.
export const test = base.extend<
  Record<never, never>,
  MetaMaskWorkerOptions & MetaMaskWorkerFixtures
>({
  walletSetup: [{ kind: 'onboard' }, { option: true, scope: 'worker' }],

  mmContext: [
    // eslint-disable-next-line no-empty-pattern -- Playwright requires the fixtures arg
    async ({}, use) => {
      const extensionPath = await resolveFlaskPath();
      const userDataDir = mkdtempSync(join(tmpdir(), 'hathor-mm-e2e-'));
      const headless = process.env.E2E_HEADLESS === '1' && process.env.E2E_HEADED !== '1';

      let context: BrowserContext | undefined;
      try {
        context = await chromium.launchPersistentContext(userDataDir, {
          headless,
          // The SRP import uses MetaMask's "Paste" button (atomic, avoids per-word drop on slow
          // machines); writing the phrase to the clipboard needs clipboard permission.
          permissions: ['clipboard-read', 'clipboard-write'],
          // The dApp is served locally but must present a Snap-allowed origin for `htr_getXpub`.
          // Remap `https://staging.wallet.hathor.network` (an allowed origin) to the local dev
          // server and accept its self-signed cert. Only this one host:port is remapped, so the
          // Snap and its node / wallet-service traffic resolve normally.
          ignoreHTTPSErrors: true,
          args: [
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`,
            '--no-sandbox',
            '--host-resolver-rules=MAP staging.wallet.hathor.network:443 127.0.0.1:5173',
            '--ignore-certificate-errors',
          ],
        });

        await use(context);
      } finally {
        // Always remove the temp profile, even if launch threw before use() ran.
        try {
          await context?.close();
        } finally {
          rmSync(userDataDir, { recursive: true, force: true });
        }
      }
    },
    { scope: 'worker' },
  ],

  metamask: [
    async ({ mmContext }, use) => {
      const driver = await MetaMaskDriver.create(mmContext);
      await use(driver);
    },
    { scope: 'worker' },
  ],

  dappPage: [
    async ({ mmContext }, use) => {
      let page: Page;
      if (SPLIT_WINDOWS) {
        // Anchor tiling on MetaMask's REAL window (a chrome-extension page), not on a stray
        // about:blank. The wallet gets its own window; the two are tiled side by side.
        const mmPage = (await waitForMetaMaskPage(mmContext)) ?? mmContext.pages()[0];
        page = await openPageInNewWindow(mmContext, mmPage);
        await closeStrayBlankPages(mmContext, page); // drop the orphaned initial about:blank
        // left: wallet (A) 75%, right: MetaMask (B) 25%.
        await tileSideBySide(mmContext, page, mmPage, 0.75);
        await dumpWindows(mmContext, 'split-setup');
      } else {
        page = await mmContext.newPage();
      }
      await use(page);
    },
    { scope: 'worker' },
  ],

  wallet: [
    async ({ metamask, dappPage, walletSetup }, use) => {
      let connected: WebWallet;
      if (walletSetup.kind === 'import') {
        const entry = lookupWallet(walletSetup.wallet);
        connected = await provisionImportedWallet(metamask, dappPage, {
          srp: entry.srp,
          network: walletSetup.network,
        });
      } else {
        connected = await provisionNewWallet(metamask, dappPage);
      }
      await use(connected);
    },
    { scope: 'worker' },
  ],
});

export const expect = test.expect;
