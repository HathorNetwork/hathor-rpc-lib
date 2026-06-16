# QA Automation Strategy — Web Wallet Snap Flows

Companion to [`qa-snap-token-flows.md`](./qa-snap-token-flows.md). Describes how the QA
cases are automated, the tooling, and how to run it.

## TL;DR

- **Stack reused, no new framework:** Playwright `@playwright/test` (already a dependency).
- **E2E drives the *real* MetaMask Flask extension** in a real browser via
  `chromium.launchPersistentContext()` and a small **custom driver** that clicks the
  actual Snap approval/rejection popups. No mocked provider.
- **Network:** public Hathor **testnet** (the Snap talks to public testnet nodes — no
  local node needed).
- **Run on demand** via `yarn e2e` (not per-PR, not on a timer — CI wiring deferred).

## Why this shape

The two flows under test (token creation, token send) are gated behind MetaMask Snap
approvals and move real value. Only a run with the real extension validates the full
path — connect, Snap install, dialog wording, approve/reject, and the on-chain result.
A mocked provider would skip exactly the part most likely to break.

The cost is that MetaMask E2E is inherently slower and more brittle than unit tests, so
it is **opt-in** (`yarn e2e`) rather than a blocking gate, and the fragile bits (the
extension's own DOM) are isolated in a single, version-pinned driver.

## Phased delivery

| Journey (Playwright project) | Scope | Status |
|------------------------------|-------|--------|
| `onboarding` | New wallet → connect + install Snap → connected home (Mainnet) | **✅ done — passing** |
| `import` | Import the `funded` wallet → connect → switch to **testnet** | done — runs by default (committed `funded` stub; clear `funded.srp` to skip) |
| `feature-example` | Template: funded wallet on testnet + stub assertion | scaffold |
| token send (`TC-ST-001`/`TC-ST-030`) | Copy the template; funded + insufficient-balance | planned |
| token creation (`TC-CT-001`/`TC-CT-021`) | Copy the template | planned |
| CI integration (xvfb / true headless) | — | deferred |

Each journey is its own Playwright **project** = one isolated MetaMask context (one wallet
state). The worker-scoped `wallet` fixture provisions that context once from the project's
`walletSetup` (`onboard`, or `import` a wallet named in `wallets.config.json`). Adding a
journey = a new spec + a new project; adding a case = a new spec reusing the provisioned
wallet. Verified against **MetaMask Flask 13.31.0**.

The `onboarding` journey needs **no funds**. Import/feature journeys reference testnet stub
wallets from `wallets.config.json`, whose Snap-derived Hathor **testnet** address is funded
externally (see *Funded wallet* below).

## Architecture

```
packages/web-wallet/
  playwright.e2e.config.ts        # separate config; boots snap (:8080) + web-wallet (:5173)
  tests/e2e/
    fixtures/metamask-fixture.ts  # worker-scoped context + walletSetup option + `wallet` fixture
    driver/
      flask.ts                    # resolve/download a pinned MetaMask Flask build
      selectors.ts                # all MetaMask DOM selectors, pinned to one Flask version
      MetaMaskDriver.ts           # onboard / import / connect+install snap / approve / reject
    helpers/
      webWallet.ts                # page object for the dApp (verified text/roles)
      journeys.ts                 # reusable provisioning (onboard/import -> connect -> network)
      wallets.ts                  # typed loader over wallets.config.json
    wallets.config.json           # committed registry of testnet stub wallets (by name)
    onboarding.spec.ts            # journey: new wallet -> connected home
    import.spec.ts                # journey: import funded wallet -> connect -> testnet
    feature-example.spec.ts       # template: copy to add a feature journey
    .cache/                       # downloaded Flask build (gitignored)
  .env.e2e.example                # E2E config template (real .env.e2e gitignored)
```

**Design principle — isolate the fragility.** Everything that couples to MetaMask's
internal DOM lives in `driver/`. Onboarding uses MetaMask's onboarding `data-testid`s
(captured from the running extension, in `selectors.ts`); the Snap connect/install/dialog
flows click by **role/visible text**. The dApp side (`helpers/webWallet.ts`) uses the
wallet's own verified text (`Connect Wallet`, `Change network`, `Assets summary`, etc.).

**Two non-obvious mechanisms the driver encodes** (discovered the hard way, all in
`MetaMaskDriver.ts`):

1. **Onboarding must complete the SRP backup.** Flask's "Create a new wallet" flow leaves
   the completion "Open wallet" button *disabled* until the Secret Recovery Phrase is
   backed up. So the driver reveals the seed, records it (`driver.seedPhrase`), and solves
   the confirmation quiz with the saved words; then it dismisses the "Perfect" modal and
   loads `home.html#` to finalize.
2. **Snap approvals are driven via `notification.html`.** MetaMask's popup *windows* do not
   render under Playwright's persistent context — they open as a stuck `about:blank`.
   Instead the driver navigates a page to `chrome-extension://<id>/notification.html`,
   which renders the pending confirmation, and clicks through each queued approval
   (connect → install → getXpub → …) until none remain.

**Snap origin allowlist (handled by an origin remap — no Snap change).** The Snap restricts
`htr_getXpub` to specific dApp origins (`RPC_RESTRICTIONS` in `packages/snap/src/constants.ts`):
`https://wallet.hathor.network` and `https://staging.wallet.hathor.network`. Rather than adding
`localhost` to that published allowlist, the harness loads the dApp under an *already-allowed*
origin and remaps it to the local dev server: the browser runs with
`--host-resolver-rules=MAP staging.wallet.hathor.network:443 127.0.0.1:5173` (see
`fixtures/metamask-fixture.ts`), so the Snap sees `https://staging.wallet.hathor.network` while
the page is actually served from `127.0.0.1:5173`. The dev server runs over TLS
(`E2E_TLS=true` → `https://localhost:5173`) and its self-signed cert is accepted via
`ignoreHTTPSErrors` / `--ignore-certificate-errors`. So `packages/snap/src/constants.ts` and
`snap.manifest.json` are left untouched — the E2E Snap build uses `snap.config.e2e.ts`, which
keeps the committed manifest byte-identical. Without the remap, connect fails with *"Method
htr_getXpub not authorized for origin …"*.

**Identity model (important).** The Snap derives the Hathor wallet from MetaMask's BIP32
entropy (`snap_getBip32Entropy`, path `m/44'/280'/0'`). The "wallet" is therefore the
**MetaMask Secret Recovery Phrase**, and the fundable address is the *Snap-derived*
Hathor address — which differs between mainnet and testnet. The web wallet defaults to
**mainnet**, so the harness explicitly switches to testnet (which itself triggers a Snap
confirmation dialog).

## Running it

```bash
# from the repo root, inside `nix develop`
yarn install                       # if not already installed (yarn berry)
cd packages/web-wallet
yarn playwright install chromium   # one-time: download the Playwright browser

# 1. Provide a MetaMask Flask build (pick ONE):
cp .env.e2e.example .env.e2e
#    a) download a pinned version (recommended): set E2E_FLASK_VERSION=13.31.0
#    b) or point at an unpacked Flask build you already have: E2E_METAMASK_PATH=/abs/path

# 2. Run (headed = interactive; default for now)
yarn e2e            # runs Playwright; auto-starts the snap (:8080) and web-wallet (:5173)
yarn e2e:headed     # forces a visible browser (useful for debugging)
```

Verified against **Flask 13.31.0**. The onboarding `data-testid`s are version-sensitive;
if a Flask bump breaks onboarding, re-capture them (the git history of this work has a
throwaway probe spec that walks and dumps each screen).

> Local note: on this machine `/usr/local/bin/yarn` (classic 1.x) and `node` can shadow
> the Nix-provided yarn-berry/Node 22. If `yarn` reports 1.x, use `corepack yarn …` (and a
> non-login `bash -c` so the Nix PATH wins). CI uses the Nix toolchain directly.

The first run downloads Flask into `tests/e2e/.cache/` (unless `E2E_METAMASK_PATH` is
set). `curl` and `unzip` must be available (they are in the Nix dev shell).

## Funded wallet (import/feature journeys, not needed for onboarding)

A default `funded` testnet stub is already committed in `tests/e2e/wallets.config.json`, so the
import/feature journeys run out of the box. The steps below are for funding that stub (or
swapping in your own):

1. Set the testnet stub MetaMask SRP in `tests/e2e/wallets.config.json` under
   `funded.srp` (committed — TESTNET STUB ONLY, never a mainnet/real-value seed). To skip these
   journeys instead, leave `funded.srp` empty.
2. Run the bootstrap to print the Snap-derived **testnet** address.
3. Fund that address via the Hathor testnet faucet / faucet service.

## Honest limitations

- **Selector drift:** MetaMask's DOM changes between versions. Pin one Flask version
  (`E2E_FLASK_VERSION` / `E2E_METAMASK_PATH`); when it changes, update `driver/selectors.ts`.
- **On-chain timing (Phases 2–3):** testnet confirmation is non-deterministic. Happy
  paths assert up to "tx submitted + success UI"; post-confirmation balance updates are a
  soft, generously-timed check — not a hard gate.
- **Headless in CI:** deferred. Locally this runs headed. The robust CI path will be
  xvfb (a real browser on a virtual display); true `--headless=new` with MetaMask MV3 is
  flakier and will be evaluated later.
- **Permanent test data:** created tokens / sent txs persist on testnet and can't be
  cleaned up. Token names are unique per run; runs are on-demand to limit fund usage.

## Traceability

| QA case | Phase | Spec |
|---------|-------|------|
| Onboarding + connect (home) | onboarding | `onboarding.spec.ts` |
| Import + connect + testnet switch | import | `import.spec.ts` |
| `TC-ST-001`, `TC-ST-030` | 2 | `send-token.spec.ts` (planned) |
| `TC-CT-001`, `TC-CT-021` | 3 | `create-token.spec.ts` (planned) |
