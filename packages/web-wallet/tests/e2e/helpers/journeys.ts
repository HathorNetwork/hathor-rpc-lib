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

/** Connect the dApp to MetaMask and install the Snap; returns the connected page object. */
async function connect(dappPage: Page, metamask: MetaMaskDriver): Promise<WebWallet> {
  const wallet = new WebWallet(dappPage);
  // Let the driver keep this tab in front while it approves Snap requests on background
  // MetaMask tabs, so the wallet stays visible throughout a headed run.
  metamask.setWalletPage(dappPage);
  await wallet.gotoHome();
  await wallet.clickConnect();
  await metamask.connectAndInstallSnap();
  await wallet.expectConnected();
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
