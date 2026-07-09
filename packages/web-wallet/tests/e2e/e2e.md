# Web Wallet E2E — Architecture & Conventions

**Read this before reading or writing any E2E test in `tests/e2e/`.**

These tests drive the **real MetaMask Flask extension** + the **Hathor Snap** against the
web-wallet's actual UI. The rules below are the architectural decisions the suite is built
on. They exist to prevent recurring confusion about *where each piece of logic belongs* —
especially around Snap approvals and network switching. When in doubt, follow these rules
literally; they were chosen deliberately over the "obvious" alternatives.

---

## TL;DR — the rules that matter most

1. **The Snap decision (approve/reject) is ALWAYS an explicit step in the spec.** Never hide
   it inside a helper. A helper that bundles `metamask.confirmDialog()` makes reject/edge
   tests impossible. Approve and reject are symmetric and both belong to the spec.
2. **Specs compose the page object and the MetaMask driver directly.** Spell out each
   Snap-backed action in the spec as separate, visible steps — drive the dApp with the page
   object, decide the Snap with the driver, assert with the page object. Keep the dApp action
   and its Snap approval as distinct steps; don't fuse them into one helper.
3. **Network switching is a spec verb, not setup.** The spec drives it explicitly, exactly
   like any other Snap action.
4. **One wallet ⟺ one Playwright project.** Same project = same wallet with accumulated
   state. Different project = a brand-new wallet.
5. **A dependent, ordered chain = one spec file with `test.describe.serial`.** Never split a
   dependent chain across multiple files.
6. **Use the real Unleash — never skip it.** Feature flags are per-network and must resolve
   from the real proxy.
7. **Assert only what the UI actually renders. Verify against the real component code first**
   — never assume a value (e.g. a fee) is displayed.

---

## The layering model

Four roles. Each has ONE job. Crossing the boundaries has caused past confusion.

| Layer | File | Job | Knows MetaMask? | Called by |
|-------|------|-----|-----------------|-----------|
| **Page object** | `helpers/webWallet.ts` | Granular dApp UI steps (open dialog, fill field, read text, assert on-screen feedback). | **No — never.** Contract: decoupled from MetaMask's DOM. | Specs (and provisioning) |
| **MetaMask driver** | `driver/MetaMaskDriver.ts` | The Snap/extension side: onboard, import, connect+install, `confirmDialog()`, `rejectDialog()`. | Yes — it *is* MetaMask. | Specs (and provisioning) |
| **Provisioning** | `helpers/journeys.ts` | How a wallet comes into existence and reaches *connected*: import/onboard → connect → install Snap. | Yes (bundles the setup-time Snap approvals). | The **fixture**, once per worker |
| **Spec** | `*.spec.ts` | The scenario: composes page-object steps + **explicit** Snap decisions + assertions. | Indirectly (calls the driver explicitly). | Playwright runner |

Mental model:
- `journeys.ts` answers **"how do I get a connected wallet?"** (setup; the fixture runs it).
- The page object answers **"what can I click/read on the dApp?"** (MetaMask-blind).
- The driver answers **"how do I approve/reject in the Snap?"**.
- The spec answers **"which steps, in what order, deciding each Snap, and what do I expect?"**.

### Keep the Snap decision in the spec

The Snap outcome is the part that varies per test: one test approves, another rejects,
another checks an intermediate state. So write it out as its own step in the spec. A
happy-path helper like `sendToken(wallet, metamask, {...})` that does fill → submit →
`confirmDialog()` → `expectSuccess()` collapses that choice and locks every caller into
approval — leaving no way to write the "reject in the Snap and check the error" test, which
is a first-class case. Accept the small
repetition in happy-path specs: it's what keeps every test free to choose its Snap outcome.

---

## Canonical spec shape

Every Snap-backed action follows the same three-beat rhythm in the spec:
**`submit (page object)` → `decide (driver)` → `assert (page object)`**.

```ts
// Happy path
await wallet.openSend();
await wallet.fillSend({ token: 'HTR', amount: '0.01', to: addr });
await wallet.submitSend();          // dApp fires the Snap request
await metamask.confirmDialog();     // <-- the Snap decision lives in the spec
await wallet.expectSendSuccess();

// Reject path — same shape, swap two lines
await wallet.submitSend();
await metamask.rejectDialog();      // <-- reject instead of approve
await wallet.expectSendError(/cancel|rejected/i);
```

Local operations (no Snap) skip the middle beat — see "Snap vs local" below.

---

## One wallet = one project; ordered chains = one serial file

**Binding mechanism** (already wired in `playwright.e2e.config.ts` + the fixture):

- `workers: 1` + `fullyParallel: false` → everything runs in one worker, in series.
- The fixtures `mmContext` / `metamask` / `dappPage` / `wallet` are **worker-scoped**: created
  once per worker, with a fresh `userDataDir` (`mkdtemp`) → a zeroed MetaMask. State (Snap
  installed, tokens created, registrations) **accumulates** across the project's tests.
- `walletSetup` (a per-project `use` option) picks **which** wallet (a key in
  `wallets.config.json`) and, optionally, an initial network.

Consequences:
- **Same project = same wallet, accumulated state.** Switching project = a new `userDataDir`
  = a brand-new MetaMask + wallet.
- A **dependent, ordered chain** (e.g. create token → send it → unregister → re-register)
  goes in **one spec file** under `test.describe.serial`. Order is the declaration order;
  a failing step short-circuits the rest (correct for a chain).
- **Do not** split a dependent chain across multiple files: `serial` only guarantees order
  *within* a file, and a failure in file A does not skip file B → broken shared state.

**Adding a new journey** = add a `project` in `playwright.e2e.config.ts` (its own
`walletSetup`) + one spec file. That's the whole cost.

---

## Network is a spec verb, controlled by the journey

- A seed is valid on **both** mainnet and testnet. **Which network a journey runs on is the
  spec's decision**, not a property of the wallet config. (There is intentionally no
  `defaultNetwork` in `wallets.config.json`.)
- Switching network triggers a Snap confirmation, so in a spec it follows the canonical
  rhythm — **explicitly**:

  ```ts
  await wallet.openNetworkDialog();
  await wallet.selectNetwork('Testnet');
  await wallet.confirmNetworkChange();
  await metamask.confirmDialog();      // explicit, like any Snap action
  await wallet.expectNetwork('Testnet');
  ```

- Tokens and registrations are **per-network**: a token registered on testnet does not show
  on mainnet. Mid-journey network changes are normal test steps; don't treat network as a
  one-time setup knob.
- `walletSetup.network` (optional) only sets an *initial* network during provisioning. Any
  change after that is a spec step.

---

## Feature flags: use the real Unleash, never skip it

- The E2E dev server runs **without** `SKIP_FEATURE_TOGGLE=true`, so the app talks to the
  **real** Unleash proxy. `SKIP_FEATURE_TOGGLE=true` makes `FeatureToggleContext` return
  early and fall back to hardcoded defaults — flag-gated UI then never appears.
- Flags are **per-network**. Example: `fee-based-tokens-webwallet.rollout` is constrained to
  `network = testnet`. So **fee-based-token tests must run on testnet.**
- After switching network, the toggle set is **re-fetched asynchronously**. **Wait for the
  flag-gated UI** (e.g. the "Token Type" Deposit/Fee selector) before asserting on it —
  don't assume it's there the instant the network changes.
- Removing the skip affects all projects; on mainnet the fee flag simply stays off (correct).

---

## Assert only what the UI renders — verify against real code

Before asserting a value, **read the actual component** and confirm it is rendered. Known
facts (verified in source) that have tripped people up:

- **Deposit token creation shows the cost**: `DEPOSIT: X HTR` / `TOTAL: ...`
  (`CreateTokenDialog.tsx`). 100 tokens → `1.00 HTR` (1% deposit). This is assertable.
- **Fee-based tokens currently show NO fee anywhere** (current behavior — likely to change soon;
  treat this as version-specific, not a permanent rule). Not in the create modal
  (`depositInCents = 0n` for fee tokens), not in the send dialog. The 1 HTR network fee only surfaces as an *error*
  message when HTR is insufficient. → For fee tokens, **assert success only**; do **not**
  invent a "fee displayed" assertion. If a fee must truly be measured, measure it via an HTR
  **balance delta** — and only when explicitly required.
- A **newly created token auto-registers** (`CreateTokenDialog` calls `registerToken(...)` on
  success), so it appears in Send/Assets immediately. The **config string**
  `[name:symbol:uid:checksum]` is shown in the "Token Created" modal — capture it if you'll
  re-register the token later.

---

## Snap vs local operations

Only these trigger a Snap approval (→ explicit `confirmDialog()`/`rejectDialog()` in the spec):
**create token, send transaction, switch network** (and connect/install during provisioning).

These are **local** (no Snap, no MetaMask step):
- **Register token** — Header menu → "Register Tokens" → paste config string → "Register
  token".
- **Unregister token** — token → `/history/:uid` → "Unregister token" → confirm toggle →
  "Unregister token".

Don't add a `metamask.confirmDialog()` after a local operation — there's no popup to drive.

---

## Headed-run viewing (optional)

For watchable headed runs the suite keeps the **Hathor wallet in the foreground**; MetaMask
tabs are intentionally never brought to front. `E2E_SPLIT_WINDOWS=1` puts the wallet and
MetaMask in two side-by-side OS windows (see `driver/windows.ts`). These are viewing
niceties only; never assert on window geometry.

---

## Pitfalls we actually hit (don't repeat them)

- ❌ Bundling the Snap approval inside a `sendToken`/`createToken` helper → can't write reject
  tests. ✅ Keep the Snap decision in the spec.
- ❌ Filing network-switch under "provisioning/setup" → can't express journeys that switch
  network mid-flow. ✅ It's a spec verb.
- ❌ Assuming information is shown for a given context → it may be deliberately hidden. ✅ Verify
  the component first; assert only what it actually renders.
- ❌ Running with `SKIP_FEATURE_TOGGLE=true` → fee-token UI never appears. ✅ Use real Unleash
  on testnet and wait for the flag-gated UI.
- ❌ Splitting a dependent chain across files → order/skip guarantees break. ✅ One serial file.
- ❌ Adding `defaultNetwork` to the wallet config → couples the seed to a network. ✅ The
  journey owns the network.

---

## Selector gotchas (hard-won writing the token-lifecycle journey)

These bit us once each — check for them when a `getByRole`/`getByText` fails:

- **Async-loaded values render a fallback first.** The Receive dialog shows
  `No address available` until the Snap's `htr_getAddress` resolves. Don't read the value the
  instant the dialog opens — wait for the fallback to be replaced
  (`await expect(addr).not.toHaveText(/no address available/i)`), then read.
- **Action buttons duplicate once tokens have balance.** There are two `Send` buttons — the
  primary quick action (first in DOM) and a per-token Send in the asset row. `Unregister
  token` appears twice — the trigger in the history view and the confirm button in the dialog.
  Disambiguate with `.first()` / `.last()` (primary/quick action is first in DOM; a dialog
  mounts on top, so its button is last) or scope to the dialog.
- **Icon-only buttons have no accessible name.** ⚠️ This is an accessibility bug in the dApp, not
  just a test inconvenience: the dialog X close and the header hamburger render only a lucide icon
  (no text, no `aria-label`), so `getByRole('button', { name: … })` can't find them. Once they get
  a proper accessible name, this workaround — and this gotcha — should be removed. Until then,
  target them structurally: the X is the `following-sibling::button` of the dialog's heading; the
  hamburger is the last button in `<header>`.
- **Toasts render their text twice** — once in a visible `<div>` and once in a
  `<span role="status" aria-live>` for screen readers. Assert with `.first()`.
- **Confirmation toggles are siblings of their label, not children.** In a
  `flex justify-between` row the label text and the toggle button are siblings, so from the
  label go up two levels (`xpath=ancestor::div[2]`) before selecting the button.

## File map

```text
tests/e2e/
  e2e.md                       # this file
  wallets.config.json          # named registry of PUBLIC testnet stub seeds (committed)
  playwright.e2e.config.ts     # (repo: packages/web-wallet/) projects + webServer (no SKIP)
  fixtures/metamask-fixture.ts # worker-scoped mmContext / metamask / dappPage / wallet
  helpers/
    webWallet.ts               # page object — MetaMask-blind dApp steps
    journeys.ts                # provisioning (import/onboard → connect → install Snap)
    wallets.ts                 # typed loader for wallets.config.json
  driver/
    MetaMaskDriver.ts          # the Snap side: onboard/import/connect, confirmDialog/rejectDialog
    selectors.ts               # MetaMask DOM selectors, pinned to one Flask version
    timeouts.ts                # centralized, env-tunable deadlines (E2E_TIMEOUT_SCALE)
    flask.ts                   # resolve/download a pinned MetaMask Flask build
    windows.ts                 # optional two-window split for headed runs
  *.spec.ts                    # one journey per file
```

## Related docs

- `packages/web-wallet/docs/qa-automation-strategy.md` — tooling, how to run the suite, and
  which layer (unit / component / E2E) owns each case.

> **Security:** `wallets.config.json` holds **public testnet stub seeds only** — never a
> mainnet seed or any wallet with real value.
