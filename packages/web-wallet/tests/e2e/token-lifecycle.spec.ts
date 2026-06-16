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

  test('creates a deposit token (QADBT) and shows the 1.00 HTR deposit', async ({ wallet, metamask }) => {
    await wallet.openCreateToken();
    await wallet.fillCreateToken({ name: `QADBT${Date.now()}`, symbol: 'QADBT', amount: '100' });
    expect(await wallet.readDepositAmount()).toBe('1.00'); // 100 tokens × 1% = 1.00 HTR
    await wallet.submitCreateToken();
    await metamask.confirmDialog();
    configA = await wallet.expectTokenCreated();
    await wallet.closeTokenCreated();
  });

  test('sends QADBT to its own address', async ({ wallet, metamask }) => {
    await wallet.openSend();
    await wallet.fillSend({ token: 'QADBT', amount: '10', to: addr });
    await wallet.submitSend();
    await metamask.confirmDialog();
    await wallet.expectSendSuccess();
  });

  test('unregisters QADBT', async ({ wallet }) => {
    await wallet.openTokenHistory('QADBT');
    await wallet.unregisterCurrentToken();
    await wallet.expectTokenNotVisible('QADBT');
  });

  test('re-imports QADBT via the New Tokens banner', async ({ wallet }) => {
    // Unregistering QADBT (a token the wallet holds on-chain) makes it "discovered"
    // again, which surfaces the New Tokens banner. Import it back through that flow,
    // targeting QADBT by its uid from the config string ([name:symbol:uid:checksum]).
    const qadbtUid = configA.replace(/^\[|\]$/g, '').split(':')[2];
    await wallet.expectImportBanner();
    await wallet.importTokenFromBanner(qadbtUid);
    await wallet.expectTokenVisible('QADBT');
  });

  test('unregisters QADBT again', async ({ wallet }) => {
    // Set up the second re-registration path: unregister once more so the
    // config-string flow (next test) has a token to register back.
    await wallet.openTokenHistory('QADBT');
    await wallet.unregisterCurrentToken();
    await wallet.expectTokenNotVisible('QADBT');
  });

  test('re-registers QADBT from its config string', async ({ wallet }) => {
    // Second registration path: Header menu → Register Tokens → paste config string.
    // Both paths (banner import above and config string here) must stay covered.
    await wallet.registerToken(configA);
    await wallet.expectTokenVisible('QADBT');
  });

  test('creates a fee-based token (QAFBT), 3 trillion units', async ({ wallet, metamask }) => {
    await wallet.openCreateToken();
    await wallet.waitForTokenTypeSelector();          // Unleash flag resolved on testnet
    await wallet.selectTokenType('fee');
    await wallet.fillCreateToken({ name: `QAFBT${Date.now()}`, symbol: 'QAFBT', amount: '3000000000000' });
    await wallet.expectNoDepositLine();                // fee tokens require no HTR deposit
    await wallet.submitCreateToken();
    await metamask.confirmDialog();
    configB = await wallet.expectTokenCreated();
    await wallet.closeTokenCreated();
    void configB;                                      // captured for parity / future re-register
  });

  test('sends QAFBT to its own address', async ({ wallet, metamask }) => {
    await wallet.openSend();
    await wallet.fillSend({ token: 'QAFBT', amount: '1000000', to: addr });
    await wallet.submitSend();
    await metamask.confirmDialog();
    await wallet.expectSendSuccess();
  });
});
