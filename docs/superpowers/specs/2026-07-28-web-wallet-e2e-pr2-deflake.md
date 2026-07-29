# PR 2 — De-flake the cold-start connect (issue #177, item 2b)

Status: **ready to implement (autonomous)**
Issue: HathorNetwork/hathor-rpc-lib#177 (item 2b)
Design: `docs/superpowers/specs/2026-07-09-web-wallet-e2e-followups-177-design.md` (decision **D1**)
Base branch: **`raul-oliveira/feat/web-wallet-e2e-followups-pr1`** (stacked on PR #178 — DECIDED, see "Base branch" below)
Feature branch: `raul-oliveira/feat/web-wallet-e2e-followups-pr2`

> **For the implementing subagent:** this spec is implementation-ready. Follow it top to bottom.
> Git is **authorized** for this branch (owner granted commit + push + open-PR autopilot for this
> sequence). Still: **no `git stash`, no destructive `git reset` that loses work** — measure the
> baseline *before* editing (natural order below), never by stashing. No `Co-Authored-By` trailer.
> All artifacts in English. Run everything inside `nix develop` with `corepack yarn` (berry).

## Base branch (DECIDED — stacked on PR 1)

PR 2 edits the centralized timeouts module and `helpers/journeys.ts`. PR 1 (#178) **moves**
`driver/timeouts.ts` → `tests/e2e/timeouts.ts` and adds a `dapp` section. Branching off plain
`master` would hit a rename/edit conflict on that module, so **PR 2 stacks on PR 1's branch**
(`raul-oliveira/feat/web-wallet-e2e-followups-pr1`) and edits the module at its final location
(`tests/e2e/timeouts.ts`). GitHub auto-retargets the PR to `master` when PR 1 merges. (Owner
confirmed the stacking on 2026-07-29 — this is final.)

## Problem

The dominant E2E flake is cold-start of MetaMask's MV3 service worker + the Snap's first heavy op.
On its first RPC the Snap starts a read-only Hathor wallet (a network connect + initial sync). The
dApp's own connect path has a **10s `NETWORK_CHECK`** race; if that fires while the cold-start is
still in flight, the dApp gives up with "Snap is not responding". Empirically (#177 item 2): a clean
run on a slow headless box was **2 passed / 3 failed**; on this box it passes only with `--retries`.

`helpers/journeys.ts` already tries to warm the Snap out-of-band (`warmSnap`) before the timed
connect, but the warm-up is **best-effort**: the provider wait and worker-wake use fixed try-counts,
and the final read-only invoke (`htr_getConnectedNetwork`) is **fire-and-forget** (`.catch(() =>
undefined)`). So `warmSnap` can return while the Snap's read-only wallet is still starting — leaving
the very race the dApp's timed check then loses.

## Decision (D1) — readiness probe before the timed connect

Convert `warmSnap` from best-effort into a **success-gated readiness probe**: do not return until
every stage has actually *succeeded*, each bounded by a real deadline (not a fixed try-count):

1. **(a)** MetaMask provider injected (`window.ethereum.request` present).
2. **(b)** `wallet_getSnaps` **resolves** → the MV3 service worker is awake and answering.
3. **(c)** `wallet_requestSnaps` **resolves** → the Snap is installed (retried; a cold worker can
   still reject the very first install call).
4. **(d)** A real read-only invoke (`htr_getConnectedNetwork`) **resolves** → the Snap's read-only
   wallet has finished starting. This is the exact step the dApp's timed check would otherwise race.

After (d), the dApp's raced `NETWORK_CHECK` hits a genuinely warm Snap. Per D1, ship the probe
first, **measure** (protocol below), and add a per-worker warm-up project only if the probe alone
doesn't stabilize.

## Changes

### 1. `tests/e2e/timeouts.ts` — add a `probe` section

Add inside the `TIMEOUTS` object (all wrapped in `ms()` so `E2E_TIMEOUT_SCALE` still scales them;
values are plain numbers, safe to pass into `page.evaluate`):

```ts
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
```

### 2. `tests/e2e/helpers/journeys.ts` — rewrite `warmSnap`

Add the import at the top (the page object already imports from here after PR 1):

```ts
import { TIMEOUTS } from '../timeouts';
```

Replace the whole `warmSnap` function with the success-gated probe:

```ts
/**
 * Drive the Snap to a *ready* state before the dApp's own timed connect runs.
 *
 * Cold MV3 service worker + the Snap's first heavy op (it starts a read-only Hathor wallet on its
 * first RPC) is the dominant E2E flake: the dApp's ~10s NETWORK_CHECK can fire while that cold-start
 * is still in flight and give up with "Snap is not responding". Warming out-of-band here only helps
 * if every stage is *guaranteed* complete — a best-effort warm-up can return with the worker still
 * cold. So each stage is success-gated with a real deadline: we do not return until (a) the provider
 * is injected, (b) wallet_getSnaps answers (worker awake), (c) the Snap is installed, and (d) the
 * Snap answers a real read-only invoke (its read-only wallet finished starting). After this returns,
 * the dApp's raced network check hits a genuinely warm Snap.
 */
async function warmSnap(dappPage: Page, metamask: MetaMaskDriver): Promise<void> {
  let done = false;
  const approvals = metamask.driveApprovalsUntil(() => done).catch(() => undefined);
  try {
    await dappPage.evaluate(
      async ([snapId, probe]) => {
        type Eth = { request: (a: unknown) => Promise<unknown> };
        const getEth = () => (window as unknown as { ethereum?: Eth }).ethereum;
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
        const withTimeout = <T>(p: Promise<T>, ms: number): Promise<T> =>
          Promise.race([
            p,
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('probe timeout')), ms),
            ),
          ]);

        // (a) Wait for MetaMask to inject its provider.
        const providerDeadline = Date.now() + probe.provider;
        while (!getEth()?.request) {
          if (Date.now() >= providerDeadline) throw new Error('MetaMask provider never injected');
          await sleep(250);
        }
        const eth = getEth() as Eth;

        // Poll a request until it *succeeds* (not a fixed try-count).
        const pollUntilOk = async (req: unknown, budgetMs: number): Promise<void> => {
          const deadline = Date.now() + budgetMs;
          for (;;) {
            try {
              await withTimeout(eth.request(req), probe.perTry);
              return;
            } catch (err) {
              if (Date.now() >= deadline) throw err;
              await sleep(300);
            }
          }
        };

        // (b) Worker awake, (c) Snap installed, (d) read-only wallet started.
        await pollUntilOk({ method: 'wallet_getSnaps' }, probe.workerWake);
        await pollUntilOk({ method: 'wallet_requestSnaps', params: { [snapId]: {} } }, probe.install);
        await pollUntilOk(
          {
            method: 'wallet_invokeSnap',
            params: { snapId, request: { method: 'htr_getConnectedNetwork' } },
          },
          probe.snapReady,
        );
      },
      [SNAP_ID, TIMEOUTS.probe] as const,
    );
  } finally {
    done = true;
    await approvals;
  }
}
```

Keep `SNAP_ID`, `connect`, `switchNetwork`, and the `provision*` helpers unchanged — only `warmSnap`
and the new import change. The final invoke is now **gated** (must resolve), which is the whole point.

## Validation — measure the de-flake (owner chose "measure properly")

The e2e webServer masks the flake by running the dApp with `SNAP_TIMEOUT_MS=60000`. To make the
cold-start race observable and prove the fix, drive the dApp with a **production-like** snap cap and
measure first-attempt pass rate before vs after, cold every run.

**Credentials.** The measurement runs the **onboarding** journey, whose driver reads
`E2E_PASSWORD` (`MetaMaskDriver.ts:128,229`, fallback `DEFAULT_PASSWORD='Test1234!Test'`). The
worktree already has a copied `.env.e2e` with `E2E_PASSWORD=Hathor@123` (the owner's local value),
which `playwright.e2e.config.ts` loads automatically — so no extra setup is needed. Onboarding uses a
**dry** wallet: no testnet HTR is spent, and **no PIN** is involved (the Snap signs off MetaMask's
unlocked seed — the standalone-wallet PIN `123123` is not read anywhere in the suite; do not wire an
`E2E_PIN`).

**Order matters — measure the baseline BEFORE editing (no stash):**

1. **Boot servers manually with a tightened snap cap** (Playwright reuses them off-CI because
   `reuseExistingServer` is true), from the worktree, inside `nix develop`. `E2E_PASSWORD` comes
   from the copied `.env.e2e`; export it inline too if you run outside the Playwright config's loader:
   ```bash
   corepack yarn workspace @hathor/hathor-rpc-handler build            # snap needs the dist
   corepack yarn workspace @hathor/snap exec mm-snap watch --config snap.config.e2e.ts &   # :8080
   SNAP_TIMEOUT_MS=8000 E2E_TLS=true corepack yarn workspace @hathor/web-wallet dev &       # :5173, prod-like cap
   ```
   (8000 < the read-only cold-start on most boxes, so a best-effort warm-up loses the race. If the
   baseline still passes N/N, lower the cap to 5000/4000 until the baseline flakes — then use that
   same cap for the after-run. Onboarding is a **dry** wallet: no testnet HTR is spent.)
2. **Baseline (pristine `warmSnap`, N=8, cold each run, retries=0):**
   ```bash
   cd packages/web-wallet
   pass=0; for i in $(seq 1 8); do \
     corepack yarn exec playwright test --config playwright.e2e.config.ts \
       --project=onboarding --retries=0 && pass=$((pass+1)); done
   echo "baseline: $pass/8"
   ```
3. **Apply the changes** (timeouts `probe` section + `warmSnap` rewrite).
4. **After (same cap, same N):** rerun the loop from step 2 → `after: $pass/8`.
5. **Record the before/after** (cap used, baseline pass rate, after pass rate) in the PR body's
   Acceptance Criteria and in this spec's changelog. Report honestly: if this box can't reproduce a
   baseline failure even at a low cap, say so, and state that the probe removes the theoretical race
   by success-gating stage (d) (fire-and-forget → awaited).

Also: `corepack yarn workspace @hathor/web-wallet run lint` clean, and one **normal** run
(`yarn e2e --project=onboarding`, the webServer's 60000 cap) passes to confirm no regression.

## Files

| File | Change |
|------|--------|
| `packages/web-wallet/tests/e2e/timeouts.ts` | add `probe` section to `TIMEOUTS` |
| `packages/web-wallet/tests/e2e/helpers/journeys.ts` | add `TIMEOUTS` import; rewrite `warmSnap` (success-gated) |
| `docs/superpowers/specs/2026-07-28-web-wallet-e2e-pr2-deflake.md` | copy this spec into the worktree (traceability) |

## PR

- **Single commit.** Message: `fix(web-wallet/e2e): de-flake cold-start connect with a snap readiness probe`
- **Title:** `fix(web-wallet): de-flake E2E cold-start connect (#177 item 2b)`
- **Template:** `.github/PULL_REQUEST_TEMPLATE/feature_branch_pr_template.md` — fill Motivation /
  Acceptance Criteria (**plain bullets**, incl. the measured before/after) / Checklist (checkboxes).
- **Assignee:** `raul-oliveira`. **Board:** project #15, Status → In Progress (Done). Use REST for
  title/body/assignee (Projects-classic GraphQL is deprecated). See the coordinator runbook for the
  exact commands.
- In the body, note this is PR 2 of the #177 sequence and closes item 2b (2a shipped in PR 1; 2c is PR 3).
