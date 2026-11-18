import { expect, test } from './fixtures/metamask-fixture';
import { hasWallet } from './helpers/wallets';

/**
 * Token lifecycle journey on the funded wallet, testnet. Serial: each step builds on the
 * previous (created tokens are sent/unregistered later), so a failure short-circuits the
 * rest. Every Snap-backed step approves explicitly via `metamask.confirmDialog()`.
 *
 * Fee-based tokens require the `fee-based-tokens-webwallet.rollout` Unleash flag, constrained
 * to testnet — hence the network switch first and the real Unleash (no SKIP_FEATURE_TOGGLE).
 */
test.describe.serial('funded wallet token lifecycle (testnet)', () => {
  test.skip(
    !hasWallet('funded'),
    'Set wallets.config.json -> funded.srp to a testnet stub seed to run this journey.',
  );

  // Per-run unique symbols (≤5 chars). Testnet tokens persist across runs, so a fixed symbol
  // could collide with a prior run and make the symbol-based selectors target the wrong token.
  // IMPORTANT: never put these in a `test(...)` title. Playwright evaluates the spec in both the
  // main and worker processes at slightly different times, so a Date.now()-derived title would
  // differ between them and abort with "Test not found in the worker process". Titles stay
  // static; the dynamic symbols live in the test bodies only.
  const tokenA = `QA${Date.now().toString(36).slice(-3).toUpperCase()}`; // deposit token
  const tokenB = `QB${Date.now().toString(36).slice(-3).toUpperCase()}`; // fee-based token

  let addr: string;
  let configA: string;
  let configB: string;

  test('switches the Hathor network to testnet', async ({ wallet, metamask }) => {
    await wallet.openNetworkDialog();
    await wallet.selectNetwork('Testnet');
    await wallet.confirmNetworkChange();
    await metamask.confirmDialog();
    await wallet.expectNetwork('Testnet');
  });

  test('sends 0.01 HTR to its own address', async ({ wallet, metamask }) => {
    addr = await wallet.getReceiveAddress();
    await wallet.openSend();
    await wallet.fillSend({ token: 'HTR', amount: '0.01', to: addr });
    await wallet.submitSend();
    await metamask.confirmDialog();
    await wallet.expectSendSuccess();
  });

  test('creates a deposit token and shows the 1.00 HTR deposit', async ({ wallet, metamask }) => {
    await wallet.openCreateToken();
    await wallet.fillCreateToken({ name: `${tokenA}${Date.now()}`, symbol: tokenA, amount: '100' });
    expect(await wallet.readDepositAmount()).toBe('1.00'); // 100 tokens × 1% = 1.00 HTR
    await wallet.submitCreateToken();
    await metamask.confirmDialog();
    configA = await wallet.expectTokenCreated();
    await wallet.closeTokenCreated();
  });

  test('sends the deposit token to its own address', async ({ wallet, metamask }) => {
    await wallet.openSend();
    await wallet.fillSend({ token: tokenA, amount: '10', to: addr });
    await wallet.submitSend();
    await metamask.confirmDialog();
    await wallet.expectSendSuccess();
  });

  test('unregisters the deposit token', async ({ wallet }) => {
    await wallet.openTokenHistory(tokenA);
    await wallet.unregisterCurrentToken();
    await wallet.expectTokenNotVisible(tokenA);
  });

  test('re-imports the deposit token via the New Tokens banner', async ({ wallet }) => {
    // Unregistering the token (one the wallet holds on-chain) makes it "discovered"
    // again, which surfaces the New Tokens banner. Import it back through that flow,
    // targeting it by its uid from the config string ([name:symbol:uid:checksum]).
    const tokenAUid = configA.replace(/^\[|\]$/g, '').split(':')[2];
    await wallet.expectImportBanner();
    await wallet.importTokenFromBanner(tokenAUid);
    await wallet.expectTokenVisible(tokenA);
  });

  test('unregisters the deposit token again', async ({ wallet }) => {
    // Set up the second re-registration path: unregister once more so the
    // config-string flow (next test) has a token to register back.
    await wallet.openTokenHistory(tokenA);
    await wallet.unregisterCurrentToken();
    await wallet.expectTokenNotVisible(tokenA);
  });

  test('re-registers the deposit token from its config string', async ({ wallet }) => {
    // Second registration path: Header menu → Register Tokens → paste config string.
    // Both paths (banner import above and config string here) must stay covered.
    await wallet.registerToken(configA);
    await wallet.expectTokenVisible(tokenA);
  });

  test('creates a fee-based token, 3 trillion units', async ({ wallet, metamask }) => {
    await wallet.openCreateToken();
    await wallet.waitForTokenTypeSelector();          // Unleash flag resolved on testnet
    await wallet.selectTokenType('fee');
    await wallet.fillCreateToken({ name: `${tokenB}${Date.now()}`, symbol: tokenB, amount: '3000000000000' });
    await wallet.expectNoDepositLine();                // fee tokens require no HTR deposit
    await wallet.submitCreateToken();
    await metamask.confirmDialog();
    configB = await wallet.expectTokenCreated();
    await wallet.closeTokenCreated();
    void configB;                                      // captured for parity / future re-register
  });

  test('sends the fee-based token to its own address', async ({ wallet, metamask }) => {
    await wallet.openSend();
    await wallet.fillSend({ token: tokenB, amount: '1000000', to: addr });
    await wallet.submitSend();
    await metamask.confirmDialog();
    await wallet.expectSendSuccess();
  });
});
