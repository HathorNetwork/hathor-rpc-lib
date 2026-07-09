import { expect, type Page } from '@playwright/test';

type NetworkName = 'Mainnet' | 'Testnet';

/**
 * Page object for the web-wallet dApp. Uses the wallet's own verified text/roles
 * (`Connect Wallet`, `Change network`, `Assets summary`, the Globe network button), so it
 * is decoupled from MetaMask's DOM (which lives in `driver/`).
 */
export class WebWallet {
  constructor(private readonly page: Page) {}

  /**
   * Keeps the Hathor wallet tab in the foreground during a headed run. MetaMask's own tabs
   * (home, approval popup) are intentionally NOT brought to front, so the screen stays on
   * the wallet as much as possible — the wallet itself renders the connect progress
   * ("requesting snap", "installing", "getting xpub"). No-op in headless.
   */
  private async focus(): Promise<void> {
    await this.page.bringToFront().catch(() => undefined);
  }

  async gotoHome(): Promise<void> {
    await this.page.goto('/');
    await this.focus();
  }

  async clickConnect(): Promise<void> {
    await this.focus();
    // MetaMaskProvider resolves the Snaps provider exactly once on mount via
    // getSnapsProvider() (a wallet_getSnaps probe + EIP-6963). A COLD MetaMask service
    // worker makes that probe time out, so the context provider stays null and clicking
    // "Connect Wallet" is a silent no-op (the loading step only flashes). So: wake the
    // worker until it actually responds, reload (re-running the detection against a
    // responsive provider), click, and confirm the loading step is SUSTAINED — a real
    // connect holds it open while requestSnap awaits the approval.
    for (let attempt = 0; attempt < 4; attempt++) {
      await this.waitForMetaMaskProvider();

      let warmed = false;
      for (let i = 0; i < 4 && !warmed; i++) {
        warmed = await this.warmSnapsProvider();
      }
      await this.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => undefined);
      await this.waitForMetaMaskProvider();

      await this.page.getByRole('button', { name: /connect wallet/i }).click().catch(() => undefined);
      await this.page.waitForTimeout(2_500);
      const sustained = await this.connectingLocator().isVisible().catch(() => false);
      if (process.env.E2E_DEBUG === '1') {
        console.log(`[dapp] connect attempt ${attempt}: warmed=${warmed} sustained=${sustained}`);
      }
      if (sustained) return;
      await this.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => undefined);
    }
    // Fail at the source: returning unsustained would shift the failure to a later step.
    throw new Error(
      'Connect Wallet did not reach a sustained connecting state after 4 warm-up attempts.',
    );
  }

  /** The dApp's connect "loading step" text (shown while connectWallet runs). */
  private connectingLocator() {
    return this.page
      .getByText(
        /requesting snap|verifying snap|checking snap|changing snap|getting xpub|initializing read-only|loading wallet data|connecting\.\.\./i,
      )
      .first();
  }

  /**
   * Wakes MetaMask's service worker by issuing wallet_getSnaps from the page (capped so a
   * truly unresponsive worker can't hang the test). Returns true if it responded.
   */
  private async warmSnapsProvider(): Promise<boolean> {
    return this.page
      .evaluate(async () => {
        const eth = (window as unknown as { ethereum?: { request?: (a: unknown) => Promise<unknown> } })
          .ethereum;
        if (!eth?.request) return false;
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 8_000),
        );
        try {
          await Promise.race([eth.request({ method: 'wallet_getSnaps' }), timeout]);
          return true;
        } catch {
          return false;
        }
      })
      .catch(() => false);
  }

  /** Waits until MetaMask has injected its EIP-1193 provider into the dApp page. */
  private async waitForMetaMaskProvider(timeoutMs = 30_000): Promise<void> {
    await this.page
      .waitForFunction(
        () => {
          const eth = (
            window as unknown as {
              ethereum?: { isMetaMask?: boolean; providers?: Array<{ isMetaMask?: boolean }> };
            }
          ).ethereum;
          if (!eth) return false;
          return (
            Boolean(eth.isMetaMask) ||
            (Array.isArray(eth.providers) && eth.providers.some((p) => p.isMetaMask))
          );
        },
        undefined,
        { timeout: timeoutMs },
      )
      .catch(() => undefined);
  }

  /** The connection succeeded once the home screen ("Assets summary") is visible. */
  async expectConnected(): Promise<void> {
    await this.focus();
    await expect(this.page.getByText(/assets summary/i)).toBeVisible({ timeout: 60_000 });
  }

  /** Header network button shows the current Hathor network (Mainnet/Testnet). */
  networkButton() {
    return this.page.getByRole('button', { name: /mainnet|testnet/i }).first();
  }

  async expectNetwork(name: NetworkName): Promise<void> {
    await this.focus();
    await expect(
      this.page.getByRole('button', { name: new RegExp(name, 'i') }).first(),
    ).toBeVisible({ timeout: 60_000 });
  }

  /** Opens the "Change network" dialog from the header. */
  async openNetworkDialog(): Promise<void> {
    await this.focus();
    await this.networkButton().click();
    await expect(this.page.getByRole('heading', { name: /change network/i })).toBeVisible();
  }

  /** Selects a network in the dialog's (Radix) Select. */
  async selectNetwork(name: NetworkName): Promise<void> {
    await this.page.getByRole('combobox').click();
    await this.page.getByRole('option', { name: new RegExp(name, 'i') }).click();
  }

  /** Clicks the dialog's "Change network" confirm button. */
  async confirmNetworkChange(): Promise<void> {
    await this.page.getByRole('button', { name: /^change network$/i }).click();
  }

  // --- Receive -------------------------------------------------------------

  /** Opens Receive, reads the wallet's address (monospace text), closes the dialog. */
  async getReceiveAddress(): Promise<string> {
    await this.focus();
    await this.page.getByRole('button', { name: /^receive$/i }).click();
    const heading = this.page.getByRole('heading', { name: /receive tokens/i });
    await expect(heading).toBeVisible();
    // The address loads asynchronously (snap htr_getAddress), so the <p> first renders the
    // "No address available" fallback — wait until it's replaced by the real address.
    const addrLocator = this.page.locator('p.font-mono.break-all').first();
    await expect(addrLocator).not.toHaveText(/no address available/i, { timeout: 30_000 });
    const address = (await addrLocator.textContent())?.trim() ?? '';
    if (!address || /no address/i.test(address)) {
      throw new Error(`Receive address unavailable: "${address}"`);
    }
    // Close via the header X button (icon-only, no accessible name) — it is the sibling
    // button of the "Receive Tokens" heading — then return to the connected home.
    await heading.locator('xpath=following-sibling::button').click();
    await expect(this.page.getByText(/assets summary/i)).toBeVisible();
    return address;
  }

  // --- Send ----------------------------------------------------------------

  /** Opens the Send dialog from the assets summary. */
  async openSend(): Promise<void> {
    await this.focus();
    // Two "Send" buttons exist once tokens have balance: the primary quick action (first in
    // DOM, navigates to /send) and per-token Send buttons in the asset list. Use the primary.
    await this.page.getByRole('button', { name: /^send$/i }).first().click();
    await expect(this.page.getByRole('heading', { name: /send tokens/i })).toBeVisible();
  }

  /** Fills the Send form: pick the token by symbol, amount, destination address. */
  async fillSend(opts: { token: string; amount: string; to: string }): Promise<void> {
    // Token is a Radix Select (role=combobox); options render as "SYMBOL - name".
    await this.page.getByRole('combobox').first().click();
    await this.page.getByRole('option', { name: new RegExp(`^${opts.token}\\b`, 'i') }).click();
    await this.page.getByPlaceholder(/^0(\.0)?$/).fill(opts.amount);
    await this.page.getByPlaceholder(/^address$/i).fill(opts.to);
  }

  /** Submits the Send form (clicks "Send token" → triggers the Snap). */
  async submitSend(): Promise<void> {
    await this.page.getByRole('button', { name: /^send token$/i }).click();
  }

  /** Success = the Send dialog closes and no error box is shown. */
  async expectSendSuccess(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /send tokens/i })).toBeHidden({ timeout: 60_000 });
  }

  /** Asserts the Send dialog's transaction-error box matches `pattern` (for reject/edge cases). */
  async expectSendError(pattern: RegExp): Promise<void> {
    await expect(this.page.getByText(pattern).first()).toBeVisible({ timeout: 60_000 });
  }

  // --- Create token --------------------------------------------------------

  /** Opens the Create Token dialog from the header menu. */
  async openCreateToken(): Promise<void> {
    await this.focus();
    await this.openHeaderMenu();
    await this.page.getByRole('button', { name: /^create tokens$/i }).click();
    await expect(this.page.getByRole('heading', { name: /create token/i })).toBeVisible();
  }

  /** Fills the create-token form's name / symbol / amount. */
  async fillCreateToken(opts: { name: string; symbol: string; amount: string }): Promise<void> {
    await this.page.getByPlaceholder('MyCoin').fill(opts.name);
    await this.page.getByPlaceholder(/^MYC/).fill(opts.symbol);
    await this.page.getByPlaceholder(/^1$|enter quantity/i).fill(opts.amount);
  }

  /** Reads the displayed deposit amount, e.g. "1.00" from "DEPOSIT: 1.00 HTR". */
  async readDepositAmount(): Promise<string> {
    const line = this.page.getByText(/DEPOSIT:\s*[\d.]+\s*HTR/i).first();
    await expect(line).toBeVisible();
    const text = (await line.textContent()) ?? '';
    const match = text.match(/DEPOSIT:\s*([\d.]+)\s*HTR/i);
    if (!match) throw new Error(`Could not parse deposit from "${text}"`);
    return match[1];
  }

  /** Asserts NO deposit line is shown (fee tokens require no HTR deposit). */
  async expectNoDepositLine(): Promise<void> {
    // Settle first: the Create button enables once the amount is set and the (fee) deposit
    // recomputed, so the absence below can't pass before a wrongly-rendered line would appear.
    await expect(this.page.getByRole('button', { name: /^create token$/i })).toBeEnabled();
    await expect(this.page.getByText(/DEPOSIT:/i)).toHaveCount(0);
  }

  /** Submits create-token (clicks "Create Token" → triggers the Snap). */
  async submitCreateToken(): Promise<void> {
    await this.page.getByRole('button', { name: /^create token$/i }).click();
  }

  /** Waits for "Token Created" and returns the displayed config string. */
  async expectTokenCreated(): Promise<string> {
    await expect(this.page.getByRole('heading', { name: /token created/i })).toBeVisible({ timeout: 90_000 });
    const config = (await this.page.locator('span.font-mono.break-all').first().textContent())?.trim() ?? '';
    if (!/^\[.+:.+:.+:.+\]$/.test(config)) {
      throw new Error(`Unexpected config string: "${config}"`);
    }
    return config;
  }

  /** Closes the "Token Created" success screen via its "Ok" button. */
  async closeTokenCreated(): Promise<void> {
    await this.page.getByRole('button', { name: /^ok$/i }).click();
    await expect(this.page.getByText(/assets summary/i)).toBeVisible();
  }

  /** Opens the header hamburger menu that holds Create/Register Tokens. */
  private async openHeaderMenu(): Promise<void> {
    // The Create/Register Tokens items render only when the header hamburger is open. The
    // hamburger is an icon-only button (no accessible name) — it is the last button in the
    // <header>. Open it if the items aren't already visible.
    const createBtn = this.page.getByRole('button', { name: /^create tokens$/i });
    if (await createBtn.isVisible().catch(() => false)) return;
    await this.page.locator('header button').last().click();
    await expect(createBtn).toBeVisible();
  }

  // --- Token list ----------------------------------------------------------

  async expectTokenVisible(symbol: string): Promise<void> {
    // Exact match: the symbol is the token-row title, but also appears inside the balance
    // string ("1.00 SYMBOL"), so a substring match would be over-broad / count duplicates.
    await expect(this.page.getByText(symbol, { exact: true }).first()).toBeVisible();
  }

  async expectTokenNotVisible(symbol: string): Promise<void> {
    await expect(this.page.getByText(symbol, { exact: true })).toHaveCount(0);
  }

  // --- Unregister (local, no Snap) ----------------------------------------

  /** Opens a token's history view by clicking its row in the assets list. */
  async openTokenHistory(symbol: string): Promise<void> {
    await this.focus();
    await this.page.getByText(new RegExp(`\\b${symbol}\\b`)).first().click();
    await expect(this.page.getByRole('button', { name: /^unregister token$/i })).toBeVisible();
  }

  /** From the open history view, unregisters the token (toggle + confirm). */
  async unregisterCurrentToken(): Promise<void> {
    // "Unregister token" appears twice once the dialog opens: the trigger in the history view
    // (first in DOM) and the dialog's confirm button (mounted on top, last in DOM).
    await this.page.getByRole('button', { name: /^unregister token$/i }).first().click();
    await expect(this.page.getByRole('heading', { name: /unregister token/i })).toBeVisible();
    // Flip the confirmation toggle: it's the sibling button of the text block, so go up to the
    // outer flex row (ancestor::div[2]: div[1] is the text container, div[2] wraps both).
    await this.page.getByText(/i want to unregister the token/i)
      .locator('xpath=ancestor::div[2]').getByRole('button').click();
    await this.page.getByRole('button', { name: /^unregister token$/i }).last().click();
    // The success toast renders the text twice (visible div + aria-live status span).
    await expect(this.page.getByText(/unregistered successfully/i).first()).toBeVisible({ timeout: 30_000 });
  }

  // --- Register (local, no Snap) ------------------------------------------

  /** Opens the Register Token dialog from the header menu and pastes a config string. */
  async registerToken(configString: string): Promise<void> {
    await this.focus();
    await this.openHeaderMenu();
    await this.page.getByRole('button', { name: /^register tokens$/i }).click();
    await expect(this.page.getByRole('heading', { name: /register token/i })).toBeVisible();
    await this.page.getByRole('textbox').first().fill(configString);
    await this.page.getByRole('button', { name: /^register token$/i }).click();
    // Specific text (not just /registered/) so a lingering "unregistered" toast can't match.
    await expect(this.page.getByText(/token registered successfully/i).first()).toBeVisible({ timeout: 30_000 });
  }

  // --- Import via "New tokens" banner (local, no Snap) --------------------

  /**
   * Waits for the "New tokens" discovery banner. It surfaces whenever the wallet
   * holds tokens on-chain that aren't registered locally — e.g. right after a
   * token is unregistered. Discovery is async (a `getTokens()` round-trip re-run
   * when the registered-token count changes), so this allows a generous timeout.
   * Targets the banner's "Import tokens." link (note the trailing period — the
   * dialog's confirm button is "Import tokens", no period).
   */
  async expectImportBanner(): Promise<void> {
    await this.focus();
    await expect(
      this.page.getByRole('button', { name: 'Import tokens.', exact: true }),
    ).toBeVisible({ timeout: 30_000 });
  }

  /**
   * Re-imports a previously-unregistered token through the New Tokens banner →
   * Import Tokens dialog (Select → Continue → Confirm → success). Selects the row
   * by its on-chain `uid`: the discovered list may also contain leftover tokens
   * from prior runs on this shared seed, so we never rely on count or position.
   * The whole flow is local (registerTokensBatch) — no Snap approval.
   */
  async importTokenFromBanner(uid: string): Promise<void> {
    await this.focus();
    // Open from the banner. The dialog mounts as an overlay on top of WalletHome,
    // so the banner's "Import tokens." button stays in the DOM behind it — scope
    // every later step to the dialog to avoid matching the banner link.
    await this.page.getByRole('button', { name: 'Import tokens.', exact: true }).click();
    const dialog = this.page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: /import tokens/i })).toBeVisible();

    // Select the target token's row by data-token-uid (present immediately, even
    // before the row's name/balance lazy-loads); the row's checkbox lives inside.
    const row = dialog.locator(`[data-token-uid="${uid}"]`);
    await expect(row).toBeVisible({ timeout: 30_000 });
    await row.getByRole('checkbox').check();

    // Select → Confirm. "Continue" enables once a token is picked; the dialog
    // fetches the selected token's details before rendering the confirm list.
    await dialog.getByRole('button', { name: /^continue$/i }).click();
    await expect(dialog.getByText(/you are about to add these tokens/i)).toBeVisible();

    // Confirm → success. "Import tokens" (no period) is the dialog's confirm button.
    await dialog.getByRole('button', { name: 'Import tokens', exact: true }).click();
    await expect(dialog.getByText(/tokens imported!/i)).toBeVisible({ timeout: 30_000 });

    // Close the success screen, back to the connected home.
    await dialog.getByRole('button', { name: /^close$/i }).click();
    await expect(this.page.getByText(/assets summary/i)).toBeVisible();
  }

  // --- Fee token (testnet, flag-gated) ------------------------------------

  /** Waits for the flag-gated "Token Type" selector to render after the toggle re-fetch. */
  async waitForTokenTypeSelector(): Promise<void> {
    await expect(this.page.getByText(/^token type$/i)).toBeVisible({ timeout: 30_000 });
  }

  /** Selects the token type in the create-token dialog ("Deposit" or "Fee"). */
  async selectTokenType(type: 'deposit' | 'fee'): Promise<void> {
    const label = type === 'fee' ? 'Fee' : 'Deposit';
    // The Token Type Select is the last combobox in the dialog (token-list comboboxes are
    // not present in Create); click it and pick the option.
    await this.page.getByRole('combobox').last().click();
    await this.page.getByRole('option', { name: new RegExp(`^${label}$`, 'i') }).click();
  }

  // --- Header burger menu --------------------------------------------------

  /**
   * Opens the burger menu and asserts the desktop dropdown shows exactly `expected`
   * (ordered, exact text). Scoped to the desktop dropdown (`div.absolute.top-full`) so the
   * parallel mobile panel (rendered in the DOM but `md:hidden`) doesn't double-match.
   */
  async expectBurgerMenuOptions(expected: string[]): Promise<void> {
    await this.focus();
    await this.openHeaderMenu();
    const menu = this.page.locator('header div.absolute.top-full');
    await expect(menu).toBeVisible();
    // Presence-only: assert each expected option is shown; order and extra items are
    // tolerated, so an intentionally-added menu entry won't break this.
    for (const label of expected) {
      await expect(menu.getByRole('button', { name: label, exact: true })).toBeVisible();
    }
    // Close it (click outside → header's click-outside handler) so it doesn't overlay
    // the next step.
    await this.page.getByText(/assets summary/i).click();
    await expect(menu).toBeHidden();
  }

  // --- Copy first address --------------------------------------------------

  /**
   * Clicks the header address chip (copies the wallet's first address) and waits for the
   * "Copied to clipboard" toast. Returns the chip's shown text and the clipboard content for
   * the spec to assert: the chip shows a truncated address (first 7 + "..." + last 7) while
   * the clipboard holds the full address.
   */
  async copyFirstAddress(): Promise<{ shown: string; clipboard: string }> {
    await this.focus();
    const origin = new URL(this.page.url()).origin;
    await this.page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin });

    const chip = this.page.getByTitle(/first address of your wallet/i);
    await expect(chip).toBeVisible();
    const shown = ((await chip.locator('span.font-mono').textContent()) ?? '').trim();

    await chip.click();
    await expect(this.page.getByText(/copied to clipboard/i).first()).toBeVisible();

    const clipboard = (await this.page.evaluate(() => navigator.clipboard.readText())).trim();
    return { shown, clipboard };
  }

  /** Asserts the clipboard holds the full address the chip shows truncated. */
  expectClipboardHoldsFullAddress({ shown, clipboard }: { shown: string; clipboard: string }): void {
    const [head, tail] = shown.split('...');
    if (!head || !tail) throw new Error(`Unexpected truncated address: "${shown}"`);
    expect(clipboard.length).toBeGreaterThan(head.length + tail.length);
    expect(clipboard.startsWith(head)).toBe(true);
    expect(clipboard.endsWith(tail)).toBe(true);
  }

  // --- Address mode dialog (local, no Snap) --------------------------------

  /** Opens the Address mode dialog from the burger menu. */
  async openAddressModeDialog(): Promise<void> {
    await this.focus();
    await this.openHeaderMenu();
    await this.page.getByRole('button', { name: /^address mode$/i }).first().click();
    await expect(this.page.getByRole('heading', { name: /^address mode$/i })).toBeVisible();
  }

  /** The Address mode modal overlay (no role=dialog; scoped via its heading). */
  private addressModeOverlay() {
    return this.page.locator('div.fixed.inset-0').filter({
      has: this.page.getByRole('heading', { name: /^address mode$/i }),
    });
  }

  /** Asserts the "Checking address usage..." loading row is shown (transient on open). */
  async expectAddressModeLoading(): Promise<void> {
    await expect(this.page.getByText(/checking address usage/i)).toBeVisible();
  }

  /** Waits out the loading check, then asserts the given mode's radio is selected. */
  async expectAddressModeSelected(mode: 'single' | 'dynamic'): Promise<void> {
    await expect(this.page.getByText(/checking address usage/i)).toBeHidden({ timeout: 30_000 });
    const name = mode === 'single' ? /single address/i : /dynamic address/i;
    await expect(this.page.getByRole('radio', { name })).toBeChecked();
  }

  /** Picks an address mode by clicking its (sr-only radio) label. Waits loading out first. */
  async chooseAddressMode(mode: 'single' | 'dynamic'): Promise<void> {
    await expect(this.page.getByText(/checking address usage/i)).toBeHidden({ timeout: 30_000 });
    const label = mode === 'single' ? 'Single Address' : 'Dynamic Address';
    await this.page.getByText(label, { exact: true }).click();
  }

  /** Clicks Save; the dialog closes on success (local localStorage write, no Snap). */
  async saveAddressMode(): Promise<void> {
    await this.page.getByRole('button', { name: /^save$/i }).click();
    await expect(this.page.getByRole('heading', { name: /^address mode$/i })).toBeHidden();
  }

  /** Closes the Address mode dialog via its header X (sibling of the heading). */
  async closeAddressModeViaX(): Promise<void> {
    await this.page.getByRole('heading', { name: /^address mode$/i })
      .locator('xpath=following-sibling::button').click();
    await expect(this.page.getByRole('heading', { name: /^address mode$/i })).toBeHidden();
  }

  /** Closes the Address mode dialog by clicking the backdrop (overlay corner). */
  async closeAddressModeViaBackdrop(): Promise<void> {
    // Click the overlay itself (top-left), not the centered panel — it only closes when
    // e.target === the overlay element.
    await this.addressModeOverlay().click({ position: { x: 5, y: 5 } });
    await expect(this.page.getByRole('heading', { name: /^address mode$/i })).toBeHidden();
  }

  /** Asserts the Address mode dialog is closed. Use in specs so closure is verified explicitly. */
  async expectAddressModeClosed(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /^address mode$/i })).toBeHidden();
  }

  // --- Send: insufficient balance ------------------------------------------

  /** Selects a token in the Send dialog by symbol (options render as "SYMBOL - name"). */
  async selectSendToken(symbol: string): Promise<void> {
    await this.page.getByRole('combobox').first().click();
    await this.page.getByRole('option', { name: new RegExp(`^${symbol}\\b`, 'i') }).click();
  }

  /** Types an amount into the Send dialog's amount field. */
  async enterSendAmount(amount: string): Promise<void> {
    await this.page.getByPlaceholder(/^0(\.0)?$/).fill(amount);
  }

  /**
   * Asserts the "Insufficient balance" message and that the submit button is disabled — and
   * therefore gray, since the button only applies `disabled:bg-muted` while disabled.
   */
  async expectSendInsufficientBalance(): Promise<void> {
    await expect(this.page.getByText(/^insufficient balance$/i)).toBeVisible();
    const submit = this.page.getByRole('button', { name: /^send token$/i });
    await expect(submit).toBeDisabled();
    await expect(submit).toHaveClass(/disabled:bg-muted/);
    // "Gray": while disabled the button paints the muted token (#57606A, see
    // tailwind.config.js) — assert the actual computed background, not just the class.
    const bg = await submit.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(87, 96, 106)');
  }

  /** Closes the Send dialog via its header X. */
  async closeSend(): Promise<void> {
    await this.page.getByRole('heading', { name: /send tokens/i })
      .locator('xpath=following-sibling::button').click();
    await expect(this.page.getByRole('heading', { name: /send tokens/i })).toBeHidden();
  }

  // --- Change network dialog: content + dismiss ----------------------------

  /** Asserts the Change network modal's descriptive texts are rendered. */
  async expectNetworkDialogContent(): Promise<void> {
    await expect(this.page.getByText(/this is where you can switch your hathor wallet network/i)).toBeVisible();
    await expect(this.page.getByText(/make sure you understand the risks before continuing/i)).toBeVisible();
    await expect(this.page.getByText(/changing the network can expose your wallet to risks/i)).toBeVisible();
    await expect(this.page.getByText(/^choose network$/i)).toBeVisible();
  }

  /** Opens the network Select and asserts Mainnet + Testnet options, then closes the list. */
  async expectNetworkSelectOptions(): Promise<void> {
    await this.page.getByRole('combobox').click();
    await expect(this.page.getByRole('option', { name: /^mainnet/i })).toBeVisible();
    await expect(this.page.getByRole('option', { name: /^testnet/i })).toBeVisible();
    await this.page.keyboard.press('Escape'); // close the listbox without selecting
  }

  /** Dismisses the Change network modal via its header X. */
  async closeNetworkDialogViaX(): Promise<void> {
    await this.page.getByRole('heading', { name: /^change network$/i })
      .locator('xpath=following-sibling::button').click();
    await expect(this.page.getByRole('heading', { name: /^change network$/i })).toBeHidden();
  }
}
