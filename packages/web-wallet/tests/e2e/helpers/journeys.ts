import type { Page } from '@playwright/test';
import type { MetaMaskDriver } from '../driver/MetaMaskDriver';
import { WebWallet } from './webWallet';

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
 * Installs the Snap and issues one read-only invoke BEFORE the dApp's timed connect runs.
 *
 * The Snap's first RPC also starts a read-only Hathor wallet (a network connect + initial
 * sync — see packages/snap onRpcRequest). On a slow machine that cold-start exceeds the dApp's
 * 10s NETWORK_CHECK timeout, so the dApp gives up with "Snap is not responding". Doing it here
 * out-of-band (untimed, with approvals driven concurrently) leaves the read-only wallet already
 * started, so the dApp's own (raced) network check hits a warm Snap and returns well within 10s.
 */
async function warmSnap(dappPage: Page, metamask: MetaMaskDriver): Promise<void> {
  let done = false;
  const approvals = metamask.driveApprovalsUntil(() => done).catch(() => undefined);
  try {
    await dappPage.evaluate(async (snapId) => {
      type Eth = { request: (a: unknown) => Promise<unknown> };
      const getEth = () => (window as unknown as { ethereum?: Eth }).ethereum;
      // Wait for MetaMask to inject its provider (cold service worker can be slow to appear).
      for (let i = 0; i < 60 && !getEth()?.request; i++) {
        await new Promise((r) => setTimeout(r, 500));
      }
      const eth = getEth();
      if (!eth?.request) return;
      const probe = async (req: unknown, ms: number) =>
        Promise.race([
          eth.request(req),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
        ]);
      // Wake the MV3 service worker so wallet_requestSnaps doesn't hang on a cold worker.
      for (let i = 0; i < 6; i++) {
        try {
          await probe({ method: 'wallet_getSnaps' }, 8_000);
          break;
        } catch {
          /* retry */
        }
      }
      // Install the Snap (raises the install approval, driven concurrently above).
      await eth.request({ method: 'wallet_requestSnaps', params: { [snapId]: {} } });
      // First invoke starts the read-only Hathor wallet inside the Snap; read-only = no dialog.
      await eth
        .request({
          method: 'wallet_invokeSnap',
          params: { snapId, request: { method: 'htr_getConnectedNetwork' } },
        })
        .catch(() => undefined);
    }, SNAP_ID);
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
