import type { BrowserContext, Locator, Page } from '@playwright/test';
import { MetaMask, MetaMaskText, Srp, Unlock } from './selectors';
import { SPLIT_WINDOWS } from './windows';
import { TIMEOUTS } from './timeouts';

const DEFAULT_PASSWORD = 'Test1234!Test';

/**
 * Drives the real MetaMask Flask extension: onboarding a fresh wallet, and approving the
 * Snap connect/install/dialog flows.
 *
 * Hard-won facts this encodes (verified against Flask 13.31.0):
 *  - Onboarding's "Open wallet" button is disabled unless the SRP backup is completed, so
 *    we reveal the seed, read it, and solve the confirmation quiz with the saved words.
 *  - MetaMask recreates the onboarding tab between screens, so every step re-acquires the
 *    live tab via {@link openHome}.
 *  - MetaMask popup windows do NOT render under Playwright's persistent context. Pending
 *    Snap approvals are driven by navigating a page to `notification.html` instead.
 *  - The local Snap must allow the dApp origin for `htr_getXpub` (see packages/snap).
 */
export class MetaMaskDriver {
  /** The 12-word seed of the wallet created during onboarding ("the backup"). */
  seedPhrase = '';

  /** Password set during onboarding/import; reused to unlock the wallet when it locks. */
  private password = DEFAULT_PASSWORD;

  private notifPage?: Page;

  /** The dApp page kept in the foreground while MetaMask is driven on background tabs. */
  private walletPage?: Page;

  private constructor(
    private readonly context: BrowserContext,
    readonly extensionId: string,
  ) {}

  static async create(context: BrowserContext): Promise<MetaMaskDriver> {
    const extensionId = await MetaMaskDriver.resolveExtensionId(context);
    return new MetaMaskDriver(context, extensionId);
  }

  /** Derives the extension id from the background worker (MV3) or page (MV2) URL. */
  private static async resolveExtensionId(context: BrowserContext): Promise<string> {
    const idFromUrl = (url: string): string | undefined =>
      url.match(/^chrome-extension:\/\/([a-p]{32})\//)?.[1];

    const worker = context.serviceWorkers()[0];
    if (worker) {
      const id = idFromUrl(worker.url());
      if (id) return id;
    }
    const backgroundPage = context.backgroundPages()[0];
    if (backgroundPage) {
      const id = idFromUrl(backgroundPage.url());
      if (id) return id;
    }
    const registered = await context
      .waitForEvent('serviceworker', { timeout: TIMEOUTS.serviceWorker })
      .catch(() => undefined);
    const id = registered && idFromUrl(registered.url());
    if (id) return id;

    throw new Error(
      'Could not resolve the MetaMask extension id (no background service worker or page found).',
    );
  }

  private extUrl(path: string): string {
    return `chrome-extension://${this.extensionId}/${path}`;
  }

  /**
   * Registers the dApp page so the driver can keep it in the foreground while it drives
   * MetaMask on background tabs. Set once the wallet page exists (see journeys `connect()`).
   */
  setWalletPage(page: Page): void {
    this.walletPage = page;
  }

  /**
   * Brings the wallet (dApp) tab back to the front. Snap approvals are driven on background
   * MetaMask tabs (opening `notification.html` activates that tab), so this restores the
   * wallet as the visible tab and keeps it there. No-op in split-window mode (wallet and
   * MetaMask already live in separate, side-by-side OS windows) and until a wallet page has
   * been registered (e.g. during raw MetaMask onboarding, before the dApp is connected).
   */
  private async refocusWallet(): Promise<void> {
    if (SPLIT_WINDOWS) return;
    const page = this.walletPage;
    if (page && !page.isClosed()) await page.bringToFront().catch(() => undefined);
  }

  /**
   * Returns the current live MetaMask home tab. MetaMask recreates the onboarding tab
   * mid-flow, so this re-resolves it rather than holding a stale handle, and never opens a
   * duplicate (a duplicate makes MetaMask close one: "Target page has been closed").
   */
  async openHome(timeoutMs = TIMEOUTS.openHome): Promise<Page> {
    const prefix = `chrome-extension://${this.extensionId}`;
    const isHome = (p: Page) =>
      !p.isClosed() && p.url().startsWith(prefix) && !p.url().includes('notification.html');

    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const page = this.context.pages().find(isHome);
      if (page) {
        await page.waitForLoadState('domcontentloaded').catch(() => undefined);
        return page;
      }
      if (Date.now() >= deadline) break;
      await delay(250);
    }
    const page = await this.context.newPage();
    await page.goto(this.extUrl('home.html'));
    await page.waitForLoadState('domcontentloaded').catch(() => undefined);
    return page;
  }

  // ---------------------------------------------------------------------------
  // Onboarding
  // ---------------------------------------------------------------------------

  /**
   * Runs MetaMask Flask's "Create a new wallet" onboarding for a throwaway test wallet,
   * completing the SRP backup (required to enable "Open wallet").
   */
  async onboardNewWallet(password: string = process.env.E2E_PASSWORD ?? DEFAULT_PASSWORD): Promise<void> {
    this.password = password;
    await this.clickButtonByText(MetaMaskText.acceptRisks); // Flask experimental gate
    await this.clickTestId(MetaMask.onboarding.createWallet);
    await this.clickTestId(MetaMask.onboarding.createWithSrp);

    const pw = await this.openHome();
    await pw.getByTestId(MetaMask.onboarding.passwordNew).fill(password);
    await pw.getByTestId(MetaMask.onboarding.passwordConfirm).fill(password);
    await pw.getByTestId(MetaMask.onboarding.passwordTerms).click();
    await pw.getByTestId(MetaMask.onboarding.passwordSubmit).click();

    const words = await this.revealAndSaveSeed();
    await this.solveSeedQuiz(words);

    // Continue triggers a "Perfect — that's right!" modal that blocks the rest.
    await this.clickTestId(MetaMask.onboarding.recoveryConfirm, TIMEOUTS.recoveryConfirm);
    await this.dismissGotItModal();

    await this.clickTestId(MetaMask.onboarding.metricsContinue);
    await this.clickTestId(MetaMask.onboarding.completeDone);

    // "Open wallet" sets completedOnboarding but doesn't navigate under automation;
    // loading the main route finalizes the wallet.
    const home = await this.openHome();
    await home.goto(this.extUrl('home.html#')).catch(() => undefined);
    await home.waitForLoadState('domcontentloaded').catch(() => undefined);
  }

  /** Reveals the SRP on the review screen, records it, and continues to the quiz. */
  private async revealAndSaveSeed(): Promise<string[]> {
    const page = await this.openHome();
    await page.getByTestId(MetaMask.onboarding.recoveryReveal).click();
    await page.waitForTimeout(1200);
    const words: string[] = [];
    for (let i = 0; i < 12; i++) {
      const raw = (await page.getByTestId(Srp.chip(i)).textContent().catch(() => '')) || '';
      words.push(raw.replace(/[^a-z]/gi, ''));
    }
    this.seedPhrase = words.join(' ');
    await page.getByTestId(MetaMask.onboarding.recoveryContinue).click();
    await page.waitForTimeout(1200);
    return words;
  }

  /** Fills the blanked quiz positions using the saved seed words. */
  private async solveSeedQuiz(words: string[]): Promise<void> {
    const page = await this.openHome();
    const unanswered: number[] = [];
    for (const el of await page.locator(Srp.unansweredSelector).all()) {
      const m = ((await el.getAttribute('data-testid').catch(() => '')) || '').match(/unanswered-(\d+)/);
      if (m) unanswered.push(Number(m[1]));
    }
    unanswered.sort((a, b) => a - b);
    for (const idx of unanswered) {
      await page.getByRole('button', { name: words[idx], exact: true }).first().click().catch(() => undefined);
      await page.waitForTimeout(300);
    }
  }

  private async dismissGotItModal(): Promise<void> {
    for (let i = 0; i < 12; i++) {
      const page = await this.openHome();
      const gotIt = page.getByRole('button', { name: MetaMaskText.gotIt }).first();
      if (await gotIt.isVisible().catch(() => false)) {
        await gotIt.click().catch(() => undefined);
        return;
      }
      await delay(1000);
    }
  }

  private async clickTestId(testid: string, timeout = TIMEOUTS.click): Promise<void> {
    const page = await this.openHome();
    await page.getByTestId(testid).click({ timeout });
  }

  private async clickButtonByText(name: RegExp, timeout = TIMEOUTS.click): Promise<void> {
    const page = await this.openHome();
    await page.getByRole('button', { name }).first().click({ timeout });
  }

  // ---------------------------------------------------------------------------
  // Import an existing wallet
  // ---------------------------------------------------------------------------

  /**
   * Runs MetaMask Flask's "Import an existing wallet" onboarding with a provided Secret
   * Recovery Phrase (12/15/18/21/24 words). Unlike {@link onboardNewWallet} there is no
   * backup quiz — the SRP is entered directly.
   */
  async importWallet(
    seedPhrase: string,
    password: string = process.env.E2E_PASSWORD ?? DEFAULT_PASSWORD,
  ): Promise<void> {
    const words = seedPhrase.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (![12, 15, 18, 21, 24].includes(words.length)) {
      throw new Error(
        `Seed phrase must be a 12/15/18/21/24-word recovery phrase; got ${words.length} word(s).`,
      );
    }
    this.seedPhrase = words.join(' ');
    this.password = password;

    // Flask experimental gate (may be absent on some versions, so best-effort). Wait as long as
    // the create flow does — on slower machines/CI the button can take well over the old 8s to
    // become actionable; missing it leaves MetaMask on the gate, so the get-started screen (and
    // the import entry) never render and every later step sees a blank tab.
    await this.clickButtonByText(MetaMaskText.acceptRisks, TIMEOUTS.acceptRisks).catch(() => undefined);
    await this.clickImportEntry();

    await this.dumpScreen('srp-screen');
    await this.fillSeedWords(words);
    await this.clickTestId(MetaMask.importing.srpConfirm);

    // Create-password screen (shared with the create flow): fill, accept terms, submit.
    const pw = await this.openHome();
    await pw.getByTestId(MetaMask.onboarding.passwordNew).fill(password);
    await pw.getByTestId(MetaMask.onboarding.passwordConfirm).fill(password);
    await pw.getByTestId(MetaMask.onboarding.passwordTerms).click();
    await this.dumpScreen('password-ready');
    await pw.getByTestId(MetaMask.onboarding.passwordSubmit).click();

    // Wallet creation → optional metrics opt-in → completion ("your wallet is ready").
    await this.finishOnboarding();
    // Settle into an unlocked home so the later connect doesn't race a lock prompt.
    await this.ensureUnlockedHome();
    await this.dumpScreen('post-onboard');
  }

  /** Unlocks the home (if needed) and waits until it stays unlocked for two checks. */
  private async ensureUnlockedHome(): Promise<void> {
    const deadline = Date.now() + TIMEOUTS.ensureUnlocked;
    let stableUnlocked = 0;
    while (Date.now() < deadline) {
      const page = await this.openHome();
      if (await this.unlockIfNeeded(page)) {
        stableUnlocked = 0;
        await delay(1_000);
        continue;
      }
      stableUnlocked += 1;
      if (stableUnlocked >= 2) return;
      await delay(1_200);
    }
    // "ensure" contract: a silent return would leak a half-unlocked wallet into a later step.
    await this.dumpScreen('unlock-timeout');
    throw new Error('Timed out waiting for MetaMask to remain unlocked.');
  }

  /**
   * Drives the post-password tail to a FINISHED wallet. Key derivation is async (the
   * create-password screen lingers), then an optional metrics opt-in, then completion.
   * "Open wallet" sets `completedOnboarding` but does NOT navigate under automation, so we
   * click it and load the home route, looping until the URL actually leaves `/onboarding` —
   * otherwise MetaMask still treats onboarding as incomplete and dApp snap requests resolve
   * without ever prompting.
   */
  private async finishOnboarding(): Promise<void> {
    const deadline = Date.now() + TIMEOUTS.finishOnboarding;
    while (Date.now() < deadline) {
      const page = await this.openHome();
      const url = page.url();

      // Left onboarding (and not on the lock screen) → finished.
      if (!url.includes('/onboarding')) {
        if (!(await this.unlockIfNeeded(page))) return;
        continue;
      }

      // Metrics opt-in, if present.
      const agree = page.getByTestId(MetaMask.onboarding.metricsContinue);
      if (await agree.isVisible().catch(() => false)) {
        await agree.click().catch(() => undefined);
        await delay(800);
        continue;
      }

      // Completion ("wallet ready"): click "Open wallet", then force-load home to finalize.
      const done = page.getByTestId(MetaMask.onboarding.completeDone);
      if (await done.isVisible().catch(() => false)) {
        await done.click().catch(() => undefined);
        await delay(800);
        await page.goto(this.extUrl('home.html#')).catch(() => undefined);
        await page.waitForLoadState('domcontentloaded').catch(() => undefined);
        await delay(800);
        continue;
      }

      await this.dumpScreen('finishing');
      await delay(1_200);
    }
    // "finish" contract: fail rather than silently return onboarding-incomplete (see above).
    await this.dumpScreen('finish-onboarding-timeout');
    throw new Error('Timed out finishing MetaMask onboarding flow.');
  }

  /** Clicks "I have an existing wallet" then "Import using Secret Recovery Phrase". */
  private async clickImportEntry(): Promise<void> {
    // Mirror the create flow (clickTestId): wait for the stable onboarding testid through a slow
    // render instead of an instant isVisible() race that falls back to brittle button text — that
    // race loses while MetaMask's onboarding UI is still on its loading spinner (slower machines/CI),
    // then hangs clicking a button that isn't there yet.
    await this.clickTestId(MetaMask.importing.importWallet); // "I have an existing wallet"
    // Social-login redesign: the import choice opens a sub-screen (?login=existing).
    await this.clickTestId(MetaMask.importing.importWithSrp); // "Import using Secret Recovery Phrase"
  }

  /** Enters the SRP into the single import field and waits for "Continue" to enable. */
  private async fillSeedWords(words: string[]): Promise<void> {
    const page = await this.openHome();
    const note = page.getByTestId(MetaMask.importing.srpNote);
    if (!(await note.isVisible({ timeout: TIMEOUTS.srpInput }).catch(() => false))) {
      await this.dumpScreen('srp-screen-missing-inputs');
      throw new Error(`SRP input ${MetaMask.importing.srpNote} not found — see the dump above.`);
    }
    const phrase = words.join(' ');
    const confirm = page.getByTestId(MetaMask.importing.srpConfirm);
    const enabled = () => confirm.isEnabled().catch(() => false);

    // Fast path: MetaMask's "Paste" button distributes all words at once (instant on a fast Mac).
    await page.evaluate((p) => navigator.clipboard.writeText(p), phrase).catch(() => undefined);
    const paste = page.getByTestId(MetaMask.importing.srpPaste);
    if (await paste.isVisible().catch(() => false)) {
      await paste.click().catch(() => undefined);
    }
    await this.waitEnabled(confirm, TIMEOUTS.srpConfirmFast);

    // Slow path: every bulk method (fill / typed phrase / paste) races MetaMask's reactive per-word
    // split on slower machines/CI and silently drops words (only 18-22 of 24 register → Confirm
    // never enables). So enter the phrase WORD BY WORD, pausing after each space so MetaMask can
    // create and focus the next word field before the next word arrives.
    if (!(await enabled())) {
      await this.clearSrp(page);
      const field = page.getByTestId(MetaMask.importing.srpNote);
      await field.click().catch(() => undefined);
      for (let i = 0; i < words.length; i++) {
        await page.keyboard.type(words[i], { delay: 15 });
        await delay(120);
        if (i < words.length - 1) {
          await page.keyboard.press('Space');
          await delay(200); // let MetaMask create + focus the next word field
        }
      }
      await this.waitEnabled(confirm, TIMEOUTS.srpConfirmSlow);
    }
    await this.dumpScreen('srp-after-fill');
  }

  /** Resets the SRP entry to a single empty field ("Clear all" appears once words are present). */
  private async clearSrp(page: Page): Promise<void> {
    const clearAll = page.getByRole('button', { name: /clear all/i }).first();
    if (await clearAll.isVisible().catch(() => false)) {
      await clearAll.click().catch(() => undefined);
      await delay(500);
    }
  }

  /** Polls until the given locator is enabled, or the timeout elapses. */
  private async waitEnabled(locator: Locator, timeoutMs: number): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await locator.isEnabled().catch(() => false)) return;
      await delay(400);
    }
  }

  /** Logs the current screen's testids/buttons when E2E_DEBUG=1 (selector discovery). */
  private async dumpScreen(label: string): Promise<void> {
    if (process.env.E2E_DEBUG !== '1') return;
    const page = await this.openHome();
    const testIds = new Set<string>();
    for (const el of await page.locator('[data-testid]').all()) {
      const t = await el.getAttribute('data-testid').catch(() => null);
      if (t) testIds.add(t);
    }
    const buttons = new Set<string>();
    for (const el of await page.getByRole('button').all()) {
      const text = ((await el.textContent().catch(() => '')) || '').trim();
      if (text) {
        const enabled = await el.isEnabled().catch(() => true);
        buttons.add(enabled ? text : `${text} (disabled)`);
      }
    }
    const inputs = new Set<string>();
    for (const el of await page.locator('input, textarea').all()) {
      const t = (await el.getAttribute('data-testid').catch(() => null)) ?? '';
      const type = (await el.getAttribute('type').catch(() => null)) ?? 'text';
      inputs.add(`${t || '(no-testid)'}[${type}]`);
    }
    console.log(
      `\n[dump:${label}] ${page.url()}\n  testids: ${[...testIds].join(', ')}` +
        `\n  buttons: ${[...buttons].join(' | ')}\n  inputs: ${[...inputs].join(', ')}`,
    );
  }

  // ---------------------------------------------------------------------------
  // Snap approvals (connect / install / dialogs) via notification.html
  // ---------------------------------------------------------------------------

  /**
   * Approves the dApp connect + Snap install + the follow-up requests (e.g. getXpub) that
   * the wallet issues on connect. Drives every pending approval until none remain.
   */
  async connectAndInstallSnap(): Promise<void> {
    await this.unlockIfNeeded(await this.openHome());
    await this.driveApprovals(TIMEOUTS.approvals.connect);
    await this.refocusWallet();
  }

  /**
   * If `page` is showing MetaMask's unlock screen, enters the password and unlocks. Returns
   * whether an unlock was performed. Imported wallets can land locked after onboarding, and
   * a locked wallet renders the unlock form on `notification.html` instead of the approval.
   */
  private async unlockIfNeeded(page: Page): Promise<boolean> {
    const input = page.getByTestId(Unlock.password);
    if (!(await input.isVisible({ timeout: TIMEOUTS.unlockProbe }).catch(() => false))) return false;
    await input.fill(this.password);
    const submit = page.getByTestId(Unlock.submit);
    if (await submit.isVisible().catch(() => false)) {
      await submit.click().catch(() => undefined);
    } else {
      await input.press('Enter').catch(() => undefined);
    }
    await delay(1_500);
    return true;
  }

  /** Approves the next pending Snap dialog (e.g. change network, send, create token). */
  async confirmDialog(): Promise<void> {
    // The dApp action that triggers this dialog often first cold-starts a *signing* Hathor wallet
    // inside the snap (htr_sendTransaction / createToken are not read-only), which is slow on some
    // machines/CI. So the approval can take far longer than the old ~10s grace to appear; wait
    // generously for the FIRST dialog before settling — otherwise it is orphaned (never clicked)
    // and the dApp hangs with the dialog open.
    await this.driveApprovals(TIMEOUTS.approvals.dialog);
    await this.refocusWallet();
  }

  /** Rejects the next pending Snap dialog. */
  async rejectDialog(): Promise<void> {
    await this.driveApprovals({ ...TIMEOUTS.approvals.reject, reject: true });
    await this.refocusWallet();
  }

  /**
   * Renders `notification.html` and clicks through whatever approval is pending. Re-renders
   * only when nothing is pending (to fetch the next queued request) — re-rendering mid-flow
   * resets multi-step screens like the install permission modal.
   */
  private async driveApprovals(opts: {
    maxMs: number;
    idleMs: number;
    reject?: boolean;
    firstGraceMs?: number;
  }): Promise<void> {
    const order = opts.reject ? MetaMaskText.rejectOrder : MetaMaskText.approveOrder;
    // The request may take a moment to register after the dApp action, so wait longer for
    // the FIRST approval to appear; once we've acted, fall back to the shorter idle window.
    const firstGraceMs = opts.firstGraceMs ?? Math.max(opts.idleMs, 10_000);
    const start = Date.now();
    let lastActive = Date.now();
    let seenAny = false;
    let notif = await this.openNotification();

    while (Date.now() - start < opts.maxMs) {
      if (notif.isClosed()) notif = await this.openNotification();
      if (await this.approveOncePass(notif, order, opts.reject ?? false)) {
        seenAny = true;
        lastActive = Date.now();
        if (opts.reject) return; // a single rejection resolves the request
        continue;
      }
      if (Date.now() - lastActive > (seenAny ? opts.idleMs : firstGraceMs)) return; // settled
      await delay(800);
    }
    // Hard cap hit with approvals still pending: fail here so callers don't proceed as if the
    // dialog was handled. (The idle-settle `return` above is the legitimate "no dialogs" exit.)
    await this.dumpScreen('approval-timeout');
    throw new Error(
      `Timed out driving MetaMask approvals after ${opts.maxMs}ms (reject=${Boolean(opts.reject)}).`,
    );
  }

  /**
   * Keeps approving every dialog that appears until `stop()` returns true. Unlike
   * {@link driveApprovals}, this never "settles" — so a slow snap cold-start that delays an
   * approval (e.g. the htr_getXpub dialog the dApp issues only after a lengthy network check)
   * can't orphan it. Intended to run concurrently with the dApp reaching its connected home.
   */
  async driveApprovalsUntil(stop: () => boolean, opts: { maxMs?: number } = {}): Promise<void> {
    const maxMs = opts.maxMs ?? TIMEOUTS.approvals.untilMaxMs;
    const start = Date.now();
    let notif = await this.openNotification();
    while (!stop() && Date.now() - start < maxMs) {
      if (notif.isClosed()) notif = await this.openNotification();
      if (!(await this.approveOncePass(notif, MetaMaskText.approveOrder, false))) await delay(600);
    }
  }

  /**
   * One pass over the notification page: unlock if locked, and approve (or reject) the pending
   * dialog if one is showing. Returns whether it acted this pass (clicked something).
   */
  private async approveOncePass(notif: Page, order: readonly RegExp[], reject: boolean): Promise<boolean> {
    if (await this.unlockIfNeeded(notif)) return true;
    let buttons = await this.readButtons(notif);
    if (process.env.E2E_DEBUG === '1') {
      console.log(`[notif] ${notif.url().split('#').pop()} buttons: ${buttons.join(' | ')}`);
    }

    if (!MetaMaskText.anyApproval.test(buttons.join(' '))) {
      // A pending confirmation renders its page before its buttons; navigating away from a
      // snap_dialog REJECTS it, so wait in place when already on an approval page and only
      // re-fetch the queue (re-navigate) when on a non-approval page.
      if (this.isApprovalUrl(notif.url())) {
        await delay(800);
      } else {
        await notif.goto(this.extUrl('notification.html')).catch(() => undefined);
        await delay(800);
      }
      buttons = await this.readButtons(notif);
    }

    if (!MetaMaskText.anyApproval.test(buttons.join(' '))) return false;

    // Scroll any privacy/permission gate.
    for (const sel of ['snap-privacy-warning-scroll', 'snap-install-scroll']) {
      const el = notif.locator(`[data-testid="${sel}"]`).first();
      if (await el.isVisible().catch(() => false)) await el.click().catch(() => undefined);
    }
    // Grant any required checkbox (e.g. "Install Hathor Wallet").
    if (!reject) {
      for (const cb of await notif.locator('input[type="checkbox"]').all()) {
        if (!(await cb.isChecked().catch(() => true))) await cb.check({ force: true }).catch(() => undefined);
      }
    }
    // Click the highest-priority action present (last match wins — modals sit on top).
    for (const name of order) {
      const button = notif.getByRole('button', { name }).last();
      if (await button.isVisible().catch(() => false) && await button.isEnabled().catch(() => false)) {
        await button.click({ timeout: TIMEOUTS.approvalClick }).catch(() => undefined);
        break;
      }
    }
    await delay(1_200);
    return true;
  }

  /** True when the URL is a pending approval page (re-navigating these would reject them). */
  private isApprovalUrl(url: string): boolean {
    return /\/(confirmation|connect)\//.test(url) || url.includes('snap-install');
  }

  private async openNotification(): Promise<Page> {
    if (!this.notifPage || this.notifPage.isClosed()) {
      if (SPLIT_WINDOWS) {
        // Keep the approval popup in MetaMask's window (not the wallet's): activate a MetaMask
        // page first so the new tab attaches to that window instead of the focused dApp window.
        await (await this.openHome()).bringToFront().catch(() => undefined);
      }
      this.notifPage = await this.context.newPage();
    }
    await this.notifPage.goto(this.extUrl('notification.html')).catch(() => undefined);
    await this.notifPage.waitForLoadState('domcontentloaded').catch(() => undefined);
    // Opening this tab activated it; bring the wallet back to front. The rest of the
    // approval loop only re-navigates this tab (goto doesn't steal focus), so the wallet
    // stays visible while we drive the approval on this background tab.
    await this.refocusWallet();
    return this.notifPage;
  }

  private async readButtons(page: Page): Promise<string[]> {
    const out: string[] = [];
    for (const el of await page.getByRole('button').all()) {
      const text = ((await el.textContent().catch(() => '')) || '').trim();
      if (text) out.push(text);
    }
    return out;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}
