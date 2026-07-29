import type { Page } from '@playwright/test';
import type { MetaMaskDriver } from '../driver/MetaMaskDriver';
import { WebWallet } from './webWallet';
import { TIMEOUTS } from '../timeouts';

export type Network = 'mainnet' | 'testnet';

/** Map the lowercase config/option network to the dApp's header display name. */
const DISPLAY: Record<Network, 'Mainnet' | 'Testnet'> = {
  mainnet: 'Mainnet',
  testnet: 'Testnet',
};

/**
 * Open the dApp network dialog, pick `network`, approve the Snap confirmation dialog it
 * triggers, and assert the header now shows that network. Lives here (not on WebWallet) so
 * the page object stays decoupled from the MetaMask driver.
 */
export async function switchNetwork(
  wallet: WebWallet,
  metamask: MetaMaskDriver,
  network: Network,
): Promise<void> {
  const display = DISPLAY[network];
  await wallet.openNetworkDialog();
  await wallet.selectNetwork(display);
  await wallet.confirmNetworkChange();
  // Changing the Hathor network triggers a Snap confirmation that must be approved.
  await metamask.confirmDialog();
  await wallet.expectNetwork(display);
}

// Local Snap id the dApp targets in E2E (see snap-utils config default + webpack SNAP_ORIGIN).
const SNAP_ID = 'local:http://localhost:8080';

/**
 * Drive the Snap to a *ready* state before the dApp's own timed connect runs.
 *
 * Cold MV3 service worker + the Snap's first heavy op (it starts a read-only Hathor wallet on its
 * first RPC) is the dominant E2E flake: the dApp's ~10s NETWORK_CHECK can fire while that cold-start
 * is still in flight and give up with "Snap is not responding". Warming out-of-band here only helps
 * if every stage is *guaranteed* complete — a best-effort warm-up can return with the worker still
 * cold. So each stage is success-gated with a real deadline: we do not return until (a) the provider
 * is injected, (b) wallet_getSnaps answers (worker awake), (c) the Snap is installed, and (d) the
 * Snap answers a real read-only invoke (its read-only wallet finished starting). After this returns,
 * the dApp's raced network check hits a genuinely warm Snap.
 */
async function warmSnap(dappPage: Page, metamask: MetaMaskDriver): Promise<void> {
  let done = false;
  const approvals = metamask.driveApprovalsUntil(() => done).catch(() => undefined);
  try {
    await dappPage.evaluate(
      async ([snapId, probe]) => {
        type Eth = { request: (a: unknown) => Promise<unknown> };
        const getEth = () => (window as unknown as { ethereum?: Eth }).ethereum;
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
        const withTimeout = <T>(p: Promise<T>, ms: number): Promise<T> =>
          Promise.race([
            p,
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('probe timeout')), ms),
            ),
          ]);

        // (a) Wait for MetaMask to inject its provider.
        const providerDeadline = Date.now() + probe.provider;
        while (!getEth()?.request) {
          if (Date.now() >= providerDeadline) throw new Error('MetaMask provider never injected');
          await sleep(250);
        }
        const eth = getEth() as Eth;

        // Poll a request until it *succeeds* (not a fixed try-count).
        const pollUntilOk = async (req: unknown, budgetMs: number): Promise<void> => {
          const deadline = Date.now() + budgetMs;
          for (;;) {
            try {
              await withTimeout(eth.request(req), probe.perTry);
              return;
            } catch (err) {
              if (Date.now() >= deadline) throw err;
              await sleep(300);
            }
          }
        };

        // (b) Worker awake, (c) Snap installed, (d) read-only wallet started.
        await pollUntilOk({ method: 'wallet_getSnaps' }, probe.workerWake);
        await pollUntilOk({ method: 'wallet_requestSnaps', params: { [snapId]: {} } }, probe.install);
        await pollUntilOk(
          {
            method: 'wallet_invokeSnap',
            params: { snapId, request: { method: 'htr_getConnectedNetwork' } },
          },
          probe.snapReady,
        );
      },
      [SNAP_ID, TIMEOUTS.probe] as const,
    );
  } finally {
    done = true;
    await approvals;
  }
}

/** Connect the dApp to MetaMask and install the Snap; returns the connected page object. */
async function connect(dappPage: Page, metamask: MetaMaskDriver): Promise<WebWallet> {
  const wallet = new WebWallet(dappPage);
  // Let the driver keep this tab in front while it approves Snap requests on background
  // MetaMask tabs, so the wallet stays visible throughout a headed run.
  metamask.setWalletPage(dappPage);
  await wallet.gotoHome();

  // Pre-install + warm the Snap so the dApp's timed network check hits a warm wallet (see above).
  await warmSnap(dappPage, metamask);

  await wallet.clickConnect();

  // Drive MetaMask approvals continuously until the wallet reaches its connected home. A slow
  // Snap cold-start can delay the htr_getXpub approval dialog past any fixed idle window, so an
  // approver that settles-and-leaves would orphan it; keep one running until connected instead.
  let connected = false;
  const approvals = metamask.driveApprovalsUntil(() => connected).catch(() => undefined);
  try {
    await wallet.expectConnected();
  } finally {
    connected = true;
    await approvals;
  }
  return wallet;
}

/** Fresh wallet (zero funds), connected, on the default network (Mainnet). */
export async function provisionNewWallet(
  metamask: MetaMaskDriver,
  dappPage: Page,
): Promise<WebWallet> {
  await metamask.onboardNewWallet();
  return connect(dappPage, metamask);
}

/** Import `srp`, connect + install Snap, then switch network only if `network` is given. */
export async function provisionImportedWallet(
  metamask: MetaMaskDriver,
  dappPage: Page,
  opts: { srp: string; network?: Network },
): Promise<WebWallet> {
  await metamask.importWallet(opts.srp);
  const wallet = await connect(dappPage, metamask);
  if (opts.network) {
    await switchNetwork(wallet, metamask, opts.network);
  }
  return wallet;
}
