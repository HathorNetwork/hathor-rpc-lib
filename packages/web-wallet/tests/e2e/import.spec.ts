import { test } from './fixtures/metamask-fixture';
import { hasWallet } from './helpers/wallets';
import { switchNetwork } from './helpers/journeys';

/**
 * Import journey: import the default funded wallet from wallets.config.json, connect the
 * web-wallet + install the Snap (done by the `wallet` fixture, on Mainnet), then switch to
 * testnet. Validates the import flow and the network-switch flow.
 *
 * Skips until a "funded" wallet is configured (its srp is non-empty in wallets.config.json).
 */
test.describe.serial('import the funded wallet and switch network', () => {
  test.skip(
    !hasWallet('funded'),
    'Set wallets.config.json -> funded.srp to a testnet stub seed to run this journey.',
  );

  test('imports the funded wallet and connects on Mainnet', async ({ wallet }) => {
    await wallet.expectConnected();
    await wallet.expectNetwork('Mainnet');
  });

  test('switches the Hathor network to testnet', async ({ wallet, metamask }) => {
    await switchNetwork(wallet, metamask, 'testnet');
  });
});
