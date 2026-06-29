/**
 * Centralized, env-tunable deadlines for the MetaMask driver.
 *
 * The driver's timeouts were scattered as magic numbers, so the suite couldn't be tuned for a
 * slow machine/CI without editing many lines. Set `E2E_TIMEOUT_SCALE` (e.g. 2) to stretch every
 * deadline at once. Only true deadlines/timeouts live here; sub-second pacing `delay()`s — which
 * are not environment-sensitive — stay inline.
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
};
