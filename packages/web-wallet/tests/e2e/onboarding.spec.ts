import { test } from './fixtures/metamask-fixture';

/**
 * Onboarding journey (no funds required) — deep UI assertions on a CLEAN wallet.
 *
 * The `wallet` fixture onboards a brand-new wallet in MetaMask Flask, connects the
 * web-wallet, and installs the Hathor Snap (walletSetup defaults to { kind: 'onboard' }).
 * A fresh wallet defaults to Mainnet, Single address mode, and zero balance — so every
 * step below is a LOCAL UI check (no Snap approvals, hence no `metamask` fixture).
 */
test.describe.serial('onboarding — clean wallet UI', () => {
  test('onboards a new wallet and reaches the connected home on Mainnet', async ({ wallet }) => {
    await wallet.expectConnected();
    await wallet.expectNetwork('Mainnet');
  });

  test('burger menu shows the expected options', async ({ wallet }) => {
    await wallet.expectBurgerMenuOptions([
      'Create Tokens',
      'Register Tokens',
      'Import Tokens',
      'Address mode',
      'Disconnect',
    ]);
  });

  test('address mode opens with loading then Single selected (default)', async ({ wallet }) => {
    await wallet.openAddressModeDialog();
    await wallet.expectAddressModeLoading();
    await wallet.expectAddressModeSelected('single');
    await wallet.closeAddressModeViaX();
  });

  test('switches address mode to Dynamic and persists it', async ({ wallet }) => {
    await wallet.openAddressModeDialog();
    await wallet.chooseAddressMode('dynamic');
    await wallet.saveAddressMode();
    // Re-open to confirm the choice persisted.
    await wallet.openAddressModeDialog();
    await wallet.expectAddressModeSelected('dynamic');
    await wallet.closeAddressModeViaX();
  });

  test('address mode dialog closes via the X button', async ({ wallet }) => {
    await wallet.openAddressModeDialog();
    await wallet.closeAddressModeViaX();
    await wallet.expectAddressModeClosed();
  });

  test('address mode dialog closes when clicking outside', async ({ wallet }) => {
    await wallet.openAddressModeDialog();
    await wallet.closeAddressModeViaBackdrop();
    await wallet.expectAddressModeClosed();
  });

  test('Send shows Insufficient balance and disables the button (zero funds)', async ({ wallet }) => {
    await wallet.openSend();
    await wallet.selectSendToken('HTR');
    await wallet.enterSendAmount('1000000');
    await wallet.expectSendInsufficientBalance();
    await wallet.closeSend();
  });

  test('copy address chip copies the first address to the clipboard', async ({ wallet }) => {
    const copied = await wallet.copyFirstAddress();
    wallet.expectClipboardHoldsFullAddress(copied);
  });

  test('change network modal shows its texts and options, and dismisses via X', async ({ wallet }) => {
    await wallet.openNetworkDialog();
    await wallet.expectNetworkDialogContent();
    await wallet.expectNetworkSelectOptions();
    await wallet.closeNetworkDialogViaX();
  });
});
