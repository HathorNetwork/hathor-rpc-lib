import { test } from './fixtures/metamask-fixture';
import { hasWallet } from './helpers/wallets';

/**
 * TEMPLATE for feature journeys. To add a journey:
 *   1. Copy this file to e.g. `send-tokens.spec.ts` (or a folder like `funded-testnet/`).
 *   2. Add a Playwright project in playwright.e2e.config.ts pointing testMatch at the new
 *      file, with the `walletSetup` the feature needs (which wallet + network).
 *   3. Replace the stub below with the feature's steps and assertions.
 *
 * The `wallet` fixture arrives connected on the project's network. When a step needs Snap
 * approval (e.g. signing a send), also inject `{ metamask }` and call
 * `await metamask.confirmDialog()` after submitting. When the dApp fails earlier (build
 * error or insufficient balance), it surfaces an error in the UI before MetaMask is called —
 * assert that instead, with no confirmDialog.
 *
 * This example uses the funded wallet on testnet (see project "feature-example").
 */
test.describe.serial('feature example (template)', () => {
  test.skip(
    !hasWallet('funded'),
    'Set wallets.config.json -> funded.srp to a testnet stub seed to run this journey.',
  );

  test('case A: connected funded wallet is on testnet (stub)', async ({ wallet }) => {
    // Replace with real feature steps, e.g.:
    //   await wallet.sendToken({ token: 'HTR', amount: '0.01', to: RECIPIENT });
    //   await metamask.confirmDialog();
    //   await wallet.expectSendSuccess();
    await wallet.expectConnected();
    await wallet.expectNetwork('Testnet');
  });
});
