/**
 * MetaMask Flask selectors, centralized so the version coupling lives in ONE place.
 *
 * Verified by walking the live extension (Flask 13.31.0, set via E2E_FLASK_VERSION) — not
 * assumed. If onboarding breaks after a Flask bump, re-capture these.
 *
 * The Snap connect/install/dialog flows happen on `notification.html` and are driven by
 * visible role/text (see MetaMaskText) because those screens vary most between versions.
 */
export const MetaMask = {
  onboarding: {
    /** "Create a new wallet" on the welcome screen. */
    createWallet: 'onboarding-create-wallet',
    /** "Use Secret Recovery Phrase" (vs social login) on the create screen. */
    createWithSrp: 'onboarding-create-with-srp-button',
    /** Create-password screen. */
    passwordNew: 'create-password-new-input',
    passwordConfirm: 'create-password-confirm-input',
    passwordTerms: 'create-password-terms',
    passwordSubmit: 'create-password-submit',
    /** Review-recovery-phrase screen: reveal the SRP, then continue to the quiz. */
    recoveryReveal: 'recovery-phrase-reveal',
    recoveryContinue: 'recovery-phrase-continue',
    /** Confirm-recovery-phrase (quiz) screen. */
    recoveryConfirm: 'recovery-phrase-confirm',
    /** "Continue" on the metametrics screen. */
    metricsContinue: 'metametrics-i-agree',
    /** "Open wallet" on the completion screen (enabled only after the SRP backup). */
    completeDone: 'onboarding-complete-done',
  },
  importing: {
    /** "I have an existing wallet" on the welcome screen. */
    importWallet: 'onboarding-import-wallet',
    /** "Import using Secret Recovery Phrase" on the social-login sub-screen (?login=existing). */
    importWithSrp: 'onboarding-import-with-srp-button',
    /** Single SRP entry field (this build uses one input, not 12 word boxes). */
    srpNote: 'srp-input-import__srp-note',
    /** "Paste" button next to the SRP field. */
    srpPaste: 'srp-input-import__paste-button',
    /** "Continue" button on the SRP screen (disabled until a valid phrase is entered). */
    srpConfirm: 'import-srp-confirm',
  },
} as const;

/** Testid prefix helpers for the SRP quiz. */
export const Srp = {
  chip: (i: number) => `recovery-phrase-chip-${i}`,
  unansweredSelector: '[data-testid^="recovery-phrase-quiz-unanswered-"]',
} as const;

/** Unlock screen (shown on home and notification when the wallet is locked). */
export const Unlock = {
  password: 'unlock-password',
  submit: 'unlock-submit',
} as const;

/**
 * Visible-text matchers (resilient to version churn).
 */
export const MetaMaskText = {
  /** Flask-only "Experimental area" gate. */
  acceptRisks: /i accept the risks/i,
  /** "Perfect — That's right!" modal shown after solving the SRP quiz. */
  gotIt: /got it/i,
  /** "Import an existing wallet" entry on the welcome screen (text fallback). */
  importExisting: /import an existing wallet|i have an existing wallet|import using secret recovery phrase|import wallet/i,
  /** Completion-screen button (text fallback for create/import "your wallet is ready"). */
  onboardingDone: /open wallet|got it|^done$|finish/i,
  /** Buttons that advance a Snap connect/install/confirm approval, in priority order. */
  approveOrder: [
    /^accept$/i,
    /^connect$/i,
    /approve & install/i,
    /^approve$/i,
    /^confirm$/i,
    /^install$/i,
    /^ok$/i,
    /got it/i,
    /^next$/i,
  ],
  /** Buttons that reject an approval, in priority order. */
  rejectOrder: [/^reject$/i, /^cancel$/i, /^deny$/i],
  /** Any button that indicates a pending Snap approval is on screen. */
  anyApproval: /accept|connect|confirm|install|^ok$|got it|approve|reject|cancel|deny/i,
} as const;
