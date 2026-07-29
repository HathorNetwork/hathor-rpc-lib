# PR 4 — Verify the MetaMask Flask download against a pinned SHA-256 (issue #177, item 6)

Status: **ready to implement (autonomous)**
Issue: HathorNetwork/hathor-rpc-lib#177 (item 6)
Design: `docs/superpowers/specs/2026-07-09-web-wallet-e2e-followups-177-design.md` (decision **D2**)
Base branch: **`raul-oliveira/feat/web-wallet-e2e-followups-pr1`** (stacked on PR #178 — PR 1 already
edits `driver/flask.ts` and adds `EXPECTED_FLASK_VERSION` in `driver/selectors.ts`; stacking avoids a
double-edit conflict and lets PR 4 co-locate the checksum with the version pin)
Feature branch: `raul-oliveira/feat/web-wallet-e2e-followups-pr4`

> **For the implementing subagent:** git is authorized for this branch (commit + push + open-PR
> autopilot for this sequence). No `Co-Authored-By`. English artifacts. Run inside `nix develop` with
> `corepack yarn` (berry). This PR does **not** run a full MetaMask journey — its validation is the
> download+verify path only, so it will not collide with PR 2's browser slot.

## Problem

`driver/flask.ts` downloads a browser extension (MetaMask Flask) from a **mutable** GitHub release
tag with **no integrity check** (`curl -fL ... | unzip`). That is a real trust surface — the asset a
tag points at can change, and this runs on contributors' machines and (after PR 3) in CI. TLS
authenticates the transport, not the artifact.

## Decision (D2) — repo-pinned SHA-256, verified before unzip

- Pin the expected **SHA-256** of the Flask zip next to the version pin (`driver/selectors.ts`,
  keyed by version). On download, compute the zip's SHA-256 and compare **before** `unzip`. On
  mismatch: delete the bad artifact and throw a clear, actionable error.
- **Opportunistically cross-check** the GitHub API asset `digest` (newer releases expose
  `digest: "sha256:<hex>"`) when present, and warn if the pin disagrees with it (a stale pin or a
  changed asset). The digest comes from the same origin as the download, so it is a sanity check, not
  the primary gate.
- Prefer resolving the asset by its immutable **`id`** where practical over re-reading the mutable
  tag; capture `id` alongside `browser_download_url`.
- Pin provenance is **trust-on-first-use**: the hash is computed once from the official GitHub
  release over TLS and, when the API exposes a `digest`, asserted to match it before being committed.
  Document how to recompute it on a Flask bump (ties into item 8's upgrade checklist in PR 1).

## Changes

### 1. `driver/selectors.ts` — pin the checksum next to the version

Add, right after `EXPECTED_FLASK_VERSION` (added by PR 1):

```ts
/**
 * SHA-256 of the official `metamask-flask-chrome-<version>.zip` release asset, keyed by version.
 * Verified before unzip (see driver/flask.ts). Trust-on-first-use: computed once from the GitHub
 * release over TLS and cross-checked against the release asset `digest` when present. To move the
 * pin, see "Upgrading the pinned MetaMask Flask version" in docs/qa-automation-strategy.md.
 */
export const EXPECTED_FLASK_SHA256: Record<string, string> = {
  '13.31.0': '<COMPUTE_AND_PIN>', // subagent fills this — see "Computing the pin" below
};
```

### 2. `driver/flask.ts` — verify before unzip; cross-check the API digest

- Extend imports:
  ```ts
  import { createHash } from 'node:crypto';
  import { execFileSync } from 'node:child_process';
  import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
  // ...
  import { EXPECTED_FLASK_VERSION, EXPECTED_FLASK_SHA256 } from './selectors';
  ```
  (PR 1 already adds `readFileSync` + the `selectors` import; extend them rather than duplicating.)

- Add a hash helper:
  ```ts
  /** SHA-256 (hex) of a file, streamed so large zips don't sit fully in memory. */
  function sha256File(path: string): string {
    return createHash('sha256').update(readFileSync(path)).digest('hex');
  }
  ```
  (If the zip is large enough to matter, use a streamed `createReadStream` + `pipeline`; `readFileSync`
  is fine for a ~50–90 MB extension zip on a dev box/CI.)

- Have `discoverFlaskAssetUrl` also return the immutable `id` and the `digest` when present. Change
  its return type to `{ url: string; digest?: string }` (and read `a.id`/`a.digest` from the asset),
  updating the one call site:
  ```ts
  const asset = await discoverFlaskAssetUrl(version); // { url, digest? }
  const assetUrl = asset.url;
  ```
  The GitHub asset shape to type: `{ id: number; name: string; browser_download_url: string; digest?: string }`.

- **Verify before unzip.** Replace the download/unpack block so the hash is checked between `curl`
  and `unzip`:
  ```ts
  try {
    execFileSync('curl', ['-fL', '--retry', '3', '-o', zipPath, assetUrl], { stdio: 'inherit' });

    const actualSha = sha256File(zipPath);
    const pinnedSha = EXPECTED_FLASK_SHA256[version];

    // Cross-check the release asset digest when the API exposes it (sanity, not the gate).
    if (asset.digest) {
      const apiSha = asset.digest.replace(/^sha256:/i, '').toLowerCase();
      if (pinnedSha && pinnedSha.toLowerCase() !== apiSha) {
        console.warn(
          `[flask] WARNING: pinned SHA-256 for ${version} disagrees with the GitHub asset digest. ` +
            `The pin may be stale or the asset changed — re-verify before trusting this build.`,
        );
      }
    }

    if (!pinnedSha) {
      throw new Error(
        `No pinned SHA-256 for MetaMask Flask ${version} in EXPECTED_FLASK_SHA256 (driver/selectors.ts). ` +
          `Add one (see the upgrade checklist in docs/qa-automation-strategy.md) before downloading.`,
      );
    }
    if (actualSha.toLowerCase() !== pinnedSha.toLowerCase()) {
      rmSync(zipPath, { force: true });
      rmSync(dest, { recursive: true, force: true });
      throw new Error(
        `MetaMask Flask ${version} SHA-256 mismatch: expected ${pinnedSha}, got ${actualSha}. ` +
          `Refusing to unpack an unverified extension. If you intentionally bumped Flask, update ` +
          `EXPECTED_FLASK_SHA256 after re-verifying selectors.`,
      );
    }

    execFileSync('unzip', ['-o', '-q', zipPath, '-d', dest], { stdio: 'inherit' });
  } catch (err) {
    throw new Error(
      `Failed to download/verify/unpack MetaMask Flask ${version} from ${assetUrl}. ` +
        `Verify the version exists and the pinned checksum is correct, or set E2E_METAMASK_PATH ` +
        `instead. Cause: ${String(err)}`,
    );
  }
  ```
  Note: the cache-hit and `E2E_METAMASK_PATH` branches are **not** re-hashed (an unpacked dir has no
  single canonical hash, and PR 1's `assertFlaskVersion` already guards those against version drift).
  The checksum gate applies to the **fresh download**, which is the untrusted-fetch surface.

## Computing the pin (`<COMPUTE_AND_PIN>`)

1. Fetch the exact asset the resolver would (prefer the non-"deprecated" `metamask-flask-chrome-*.zip`
   for `v13.31.0`) over TLS, e.g.:
   ```bash
   curl -fL --retry 3 -o /tmp/flask-13.31.0.zip \
     "$(curl -fsSL -H 'Accept: application/vnd.github+json' \
        https://api.github.com/repos/MetaMask/metamask-extension/releases/tags/v13.31.0 \
        | node -e 'const j=JSON.parse(require("fs").readFileSync(0));const a=(j.assets||[]).filter(x=>/^metamask-flask-chrome-.*\.zip$/.test(x.name));const p=a.find(x=>!/deprecated/i.test(x.name))||a[0];process.stdout.write(p.browser_download_url)')"
   shasum -a 256 /tmp/flask-13.31.0.zip
   ```
   (If a `tests/e2e/.cache/flask-13.31.0.zip` already exists from a prior run, hash **that** — it is
   the exact artifact the suite has been using — and, when the API digest is present, confirm they
   match before pinning.)
2. **Cross-check** against the API asset `digest` for that release when present; they must match.
3. Put the hex (lowercase, no `sha256:` prefix) into `EXPECTED_FLASK_SHA256['13.31.0']`.
4. Record in the PR body how the pin was obtained (URL + API digest match), so review can reproduce it.

## Validation

- **Happy path:** clear the cache and run the resolver so it downloads + verifies + unpacks:
  ```bash
  rm -rf packages/web-wallet/tests/e2e/.cache/flask-13.31.0*
  cd packages/web-wallet && corepack yarn exec tsx -e \
    "import('./tests/e2e/driver/flask.ts').then(m=>m.resolveFlaskPath()).then(p=>console.log('OK',p))"
  ```
  (Use whatever TS runner the repo has — `tsx`/`ts-node`/`vite-node`; confirm which exists. Requires
  `E2E_FLASK_VERSION=13.31.0` in `.env.e2e` or the env.) Expect: downloads, prints `OK <dir>`.
- **Tamper path:** temporarily set `EXPECTED_FLASK_SHA256['13.31.0']` to a wrong hex, clear the cache,
  rerun → it must **throw the mismatch error AND remove** the zip + dest (verify they are gone). Then
  revert the wrong hash.
- **No-pin path:** temporarily remove the `13.31.0` entry, clear cache, rerun → the "No pinned
  SHA-256" error fires (never downloads-then-unpacks unverified). Revert.
- `corepack yarn workspace @hathor/web-wallet run lint` clean.

## Files

| File | Change |
|------|--------|
| `packages/web-wallet/tests/e2e/driver/selectors.ts` | add `EXPECTED_FLASK_SHA256` map |
| `packages/web-wallet/tests/e2e/driver/flask.ts` | hash helper; return `{url,digest?}` from discover; verify-before-unzip; delete-on-mismatch |
| `packages/web-wallet/docs/qa-automation-strategy.md` | extend the "Upgrading the pinned MetaMask Flask version" checklist (PR 1) with the "recompute the SHA-256" step |
| `docs/superpowers/specs/2026-07-28-web-wallet-e2e-pr4-flask-checksum.md` | copy this spec into the worktree |

## PR

- **Single commit.** Message: `feat(web-wallet/e2e): verify MetaMask Flask download against a pinned SHA-256`
- **Title:** `feat(web-wallet): verify MetaMask Flask download integrity (#177 item 6)`
- **Template** feature-branch: Motivation / Acceptance Criteria (**plain bullets**, incl. how the pin
  was computed + digest cross-check) / Checklist.
- **Assignee** `raul-oliveira`; **Board** project #15 → In Progress (Done). REST for
  title/body/assignee. Body: PR 4 of the #177 sequence, closes item 6; note it stacks on PR 1.
