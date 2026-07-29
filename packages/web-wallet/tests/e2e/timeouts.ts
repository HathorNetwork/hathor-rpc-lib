/**
 * Centralized, env-tunable deadlines for the whole E2E suite (driver + page object).
 *
 * The deadlines were scattered as magic numbers, so the suite couldn't be tuned for a slow
 * machine/CI without editing many lines. Set `E2E_TIMEOUT_SCALE` (e.g. 2) to stretch every
 * deadline at once. Only true deadlines/timeouts live here; sub-second pacing `delay()`s — which
 * are not environment-sensitive — stay inline.
 *
 * This lives at the suite root (not under `driver/`) so the MetaMask-blind page object
 * (`helpers/webWallet.ts`) can share the same knob without importing from `driver/`.
 */
const scale = Number(process.env.E2E_TIMEOUT_SCALE) || 1;
const ms = (base: number): number => Math.round(base * scale);

/** Window for {@link MetaMaskDriver.driveApprovals}. */
type ApprovalWindow = { maxMs: number; idleMs: number; firstGraceMs?: number };

export const TIMEOUTS = {
  /** Re-resolving the live MetaMask home tab. */
  openHome: ms(30_000),
  /** Waiting for the MV3 service worker to register (extension-id resolution). */
  serviceWorker: ms(30_000),
  /** Default single click on an onboarding test id / button. */
  click: ms(30_000),
  /** SRP input to appear on the import screen. */
  srpInput: ms(10_000),
  /** "Confirm recovery phrase" (post-quiz) click. */
  recoveryConfirm: ms(15_000),
  /** Bounded poll for all SRP chips to populate on the reveal screen (slow renders). */
  seedReveal: ms(15_000),
  /** Flask experimental-risks gate — best-effort, but slow renders need a long wait. */
  acceptRisks: ms(30_000),
  /** SRP "Continue" to enable after the fast (Paste) entry path. */
  srpConfirmFast: ms(8_000),
  /** SRP "Continue" to enable after the slow (word-by-word) entry path. */
  srpConfirmSlow: ms(20_000),
  /** Settling into an unlocked home after onboarding/import. */
  ensureUnlocked: ms(30_000),
  /** Driving the onboarding tail to a finished wallet. */
  finishOnboarding: ms(120_000),
  /** Unlock form to appear on a (possibly locked) page. */
  unlockProbe: ms(2_000),
  /** A single approval-button click. */
  approvalClick: ms(4_000),
  /** Approval windows, by call site. */
  approvals: {
    /** connect + install (long; many dialogs, slow cold start). */
    connect: { maxMs: ms(150_000), idleMs: ms(7_000), firstGraceMs: ms(30_000) } as ApprovalWindow,
    /** A single follow-up dialog (send/createToken cold-start a signing wallet first). */
    dialog: { maxMs: ms(90_000), idleMs: ms(4_000), firstGraceMs: ms(75_000) } as ApprovalWindow,
    /** A rejection resolves on the first dialog, so a shorter window suffices. */
    reject: { maxMs: ms(40_000), idleMs: ms(3_500) } as ApprovalWindow,
    /** Hard cap for {@link MetaMaskDriver.driveApprovalsUntil} (runs until connected). */
    untilMaxMs: ms(170_000),
  },
  /**
   * dApp-side (page object) deadlines. These are the web-wallet's own UI waits — distinct from
   * the driver's MetaMask deadlines above and from `SNAP_TIMEOUT_MS` (the dApp's 10s snap-RPC
   * cap). Scaling `E2E_TIMEOUT_SCALE` now stretches these too.
   */
  dapp: {
    /** Connected-home marker ("Assets summary") after connect/import. */
    connectedHome: ms(60_000),
    /** Header network button reflecting a switch. */
    network: ms(60_000),
    /** An async-loaded value replacing its fallback (e.g. Receive address). */
    asyncValue: ms(30_000),
    /** A Snap-backed dialog settling (send success/error). */
    dialogSettle: ms(60_000),
    /** "Token Created" success screen (cold-starts a signing wallet). */
    tokenCreated: ms(90_000),
    /** A success/status toast appearing. */
    toast: ms(30_000),
    /** The "New tokens" discovery banner / its rows (async getTokens round-trip). */
    banner: ms(30_000),
    /** Flag-gated UI after an async toggle re-fetch (e.g. Token Type selector). */
    flagGatedUi: ms(30_000),
    /** "Checking address usage…" resolving in the Address mode dialog. */
    addressUsage: ms(30_000),
  },
  /**
   * Out-of-band Snap warm-up (helpers/journeys.ts `warmSnap`) budgets. Each stage is polled until
   * it *succeeds*, so these are success deadlines, not fixed try-counts. Passed into the page's
   * evaluate() context, so they must stay plain numbers.
   */
  probe: {
    /** MetaMask provider injection (cold service worker can be slow to appear). */
    provider: ms(30_000),
    /** Per-request race cap inside each poll. */
    perTry: ms(8_000),
    /** wallet_getSnaps answering (MV3 worker awake). */
    workerWake: ms(45_000),
    /** wallet_requestSnaps resolving (install; retried on a cold-worker reject). */
    install: ms(60_000),
    /** First real invoke resolving (read-only wallet started). */
    snapReady: ms(60_000),
  },
};
