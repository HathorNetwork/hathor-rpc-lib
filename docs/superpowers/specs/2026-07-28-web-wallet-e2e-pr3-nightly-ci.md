# PR 3 — Nightly non-gating real-MetaMask E2E CI (issue #177, item 2c)

Status: **ready to implement (autonomous)**
Issue: HathorNetwork/hathor-rpc-lib#177 (item 2c)
Design: `docs/superpowers/specs/2026-07-09-web-wallet-e2e-followups-177-design.md`
Base branch: **`master`** (independent — the workflow builds the handler explicitly, so it does not
depend on PR 1's self-sufficient `yarn e2e`)
Feature branch: `raul-oliveira/feat/web-wallet-e2e-followups-pr3`

> **For the implementing subagent:** git is authorized for this branch (commit + push + open-PR
> autopilot for this sequence). No `Co-Authored-By`. English artifacts. Full green requires a real
> scheduled GitHub run; locally you validate by **linting the YAML and dry-running the individual
> steps** — do **not** run the full headed suite here (that browser slot is PR 2's).

## Problem

Nothing exercises the real-MetaMask suite in CI. `main.yml` runs on `[push]` and only runs the
lightweight smoke (`playwright test --project=chromium`), not `playwright.e2e.config.ts`. So rot like
item 1 (clean checkout can't run the suite) goes unnoticed until someone runs it by hand. The suite
is **explicitly non-gating**, so the fix is a **scheduled, signal-only** run — never a required
check, never blocking a PR.

## Decision

A new **scheduled** GitHub Actions workflow, separate from `main.yml`, that runs the real-MetaMask
suite for signal only. A scheduled workflow never attaches as a PR status check, so it is inherently
non-gating; additionally it must **not** be added to branch protection / required checks. It reuses
the Nix toolchain from `main.yml`, boots a real headed Chromium under **xvfb** (MV3 extension loading
needs a real display; true `--headless` is deferred per the design's out-of-scope), and uploads the
HTML report + traces + videos as artifacts for triage.

## Change — `.github/workflows/e2e-web-wallet-nightly.yml` (new)

```yaml
# Real-MetaMask-Flask E2E suite for the web-wallet — SIGNAL ONLY, NON-GATING.
#
# This runs on a schedule (not per-PR) purely to surface rot in the on-demand E2E infrastructure
# (see packages/web-wallet/tests/e2e/e2e.md). It is NOT a required check and MUST NOT be added to
# branch protection. A red run means "a real-MetaMask journey didn't pass on the runner", which is
# often a slow cold-start rather than a broken product — triage via the uploaded artifacts.
name: E2E Web Wallet (nightly, non-gating)

on:
  schedule:
    - cron: '0 6 * * *' # 06:00 UTC daily
  workflow_dispatch: {} # allow manual runs from the Actions tab

concurrency:
  group: e2e-web-wallet-nightly
  cancel-in-progress: false

permissions:
  contents: read

jobs:
  e2e:
    runs-on: ubuntu-latest
    # Non-gating: never fail the workflow status in a way that could be mistaken for a gate.
    # The step-level result + artifacts carry the signal; a red job here blocks nobody.
    timeout-minutes: 60
    env:
      # Pin the Flask build the selectors are verified against (driver/selectors.ts).
      E2E_FLASK_VERSION: '13.31.0'
      # Stretch every driver + page-object deadline for a slower shared runner.
      E2E_TIMEOUT_SCALE: '2'
      # MetaMask password for the throwaway wallet the driver onboards/imports each run. NOT a
      # secret — it guards a fresh local MetaMask created per run; the funded seed is already public
      # in wallets.config.json. The driver defaults to DEFAULT_PASSWORD ('Test1234!Test') if unset;
      # 'Hathor@123' matches the owner's local .env.e2e so CI reproduces local runs 1:1. Override via
      # a repo Actions variable `vars.E2E_PASSWORD` if desired.
      E2E_PASSWORD: ${{ vars.E2E_PASSWORD || 'Hathor@123' }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install Nix
        uses: cachix/install-nix-action@ba0dd844c9180cbf77aa72a116d6fbc515d0e87b
        with:
          nix_path: nixpkgs=channel:nixos-unstable
          extra_nix_config: |
            experimental-features = nix-command flakes

      - name: Cache Nix
        uses: DeterminateSystems/magic-nix-cache-action@v7

      - name: Install dependencies
        run: nix develop . -c yarn install --immutable

      # Independent of PR 1: build the workspace dependency the snap dev build consumes, so this
      # workflow is self-sufficient whether or not PR 1's self-building `yarn e2e` has merged.
      - name: Build hathor-rpc-handler (snap dependency)
        run: nix develop . -c yarn workspace @hathor/hathor-rpc-handler build

      - name: Install Playwright Chromium
        run: nix develop . -c yarn workspace @hathor/web-wallet exec playwright install chromium --with-deps

      - name: Install xvfb
        run: sudo apt-get update && sudo apt-get install -y xvfb

      # Headed Chromium under a virtual display (MV3 extensions need a real display). The Playwright
      # config's webServer boots the local snap (:8080) and the dApp dev server (:5173) itself.
      - name: Run real-MetaMask E2E suite
        run: |
          xvfb-run -a nix develop . -c \
            yarn workspace @hathor/web-wallet exec \
            playwright test --config playwright.e2e.config.ts

      - name: Upload Playwright report
        if: ${{ always() }}
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: packages/web-wallet/playwright-report/
          retention-days: 14
          if-no-files-found: ignore

      - name: Upload traces & videos
        if: ${{ always() }}
        uses: actions/upload-artifact@v4
        with:
          name: playwright-traces
          path: packages/web-wallet/test-results/
          retention-days: 14
          if-no-files-found: ignore
```

### Notes for the subagent (verify, don't assume)

- **`--immutable`** on install: confirm the repo's yarn install is clean in CI; if `main.yml` uses a
  plain `yarn install`, match that instead to avoid lockfile-churn failures. Prefer matching
  `main.yml`'s exact invocation.
- **`E2E_PASSWORD`** (confirmed): the driver reads it at `MetaMaskDriver.ts:128,229` with fallback
  `DEFAULT_PASSWORD = 'Test1234!Test'`. The env line is therefore optional, but keep it set to
  `Hathor@123` (the owner's local value) so CI reproduces local runs 1:1. Any valid MetaMask password
  works — the wallet is created fresh each run, so the value only needs to be internally consistent.
- **No PIN is consumed.** The E2E suite reads only `E2E_PASSWORD` (plus `E2E_FLASK_VERSION`,
  `E2E_TIMEOUT_SCALE`, `E2E_HEADED/HEADLESS`, `E2E_METAMASK_PATH`, `E2E_DEBUG`, `E2E_SPLIT_WINDOWS`).
  There is no PIN env var and no page object types a PIN — the Snap signs off MetaMask's unlocked
  seed, so the standalone-wallet PIN (`123123`) is not needed anywhere in these workflows. Do not wire
  an unused `E2E_PIN`.
- **Funded journeys**: `import`, `feature-example`, `token-lifecycle` use the committed `funded`
  testnet stub seed; they pass only while that testnet address has balance. On a dry wallet they fail
  at their first funded step — acceptable for a non-gating signal run. If the team wants a clean
  always-green signal, a follow-up can restrict the schedule to `--project=onboarding` (dry); leave
  the full matrix here and document the caveat in the PR body.
- **xvfb availability**: `xvfb-run` comes from the `xvfb` apt package (installed above);
  `playwright install --with-deps` does not guarantee it. Keep the explicit apt step.
- **Pin actions** the way `main.yml` does (it pins `install-nix-action` by SHA, uses
  `magic-nix-cache-action@v7`). Match those exact refs.

## Validation

- **Lint the YAML**: `nix develop . -c npx --yes @action-validator/cli .github/workflows/e2e-web-wallet-nightly.yml`
  (or `actionlint` if available in the shell); at minimum, parse it with a YAML loader to confirm it
  is well-formed. Confirm indentation and that every `uses:` ref matches `main.yml`'s style.
- **Dry-run the load-bearing steps locally** (inside `nix develop`): `yarn install`, the handler
  build, `playwright install chromium` — confirm each succeeds. Do **not** run the full headed suite
  locally (PR 2 owns the browser slot during the sequence).
- State plainly in the PR that **full green requires a real scheduled/`workflow_dispatch` run on
  GitHub**; the local checks only prove the workflow is well-formed and its steps resolve.

## Files

| File | Change |
|------|--------|
| `.github/workflows/e2e-web-wallet-nightly.yml` | **new** scheduled non-gating workflow |
| `packages/web-wallet/tests/e2e/e2e.md` | one line pointing at the nightly workflow as the CI signal (optional, keep tiny) |
| `docs/superpowers/specs/2026-07-28-web-wallet-e2e-pr3-nightly-ci.md` | copy this spec into the worktree |

## PR

- **Single commit.** Message: `ci(web-wallet): nightly non-gating real-MetaMask E2E workflow`
- **Title:** `ci(web-wallet): nightly non-gating E2E workflow (#177 item 2c)`
- **Template** feature-branch: Motivation / Acceptance Criteria (**plain bullets**) / Checklist.
- **Assignee** `raul-oliveira`; **Board** project #15 → In Progress (Done). REST for
  title/body/assignee. In the body: PR 3 of the #177 sequence, closes item 2c; note it is
  intentionally non-gating and must not be added to required checks.
