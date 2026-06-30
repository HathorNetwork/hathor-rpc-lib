import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = resolve(here, '..', '.cache');

/**
 * Resolves a path to an *unpacked* MetaMask Flask build to load as a Chromium extension.
 *
 * Resolution order:
 *  1. `E2E_METAMASK_PATH` — an already-unpacked Flask directory (fastest; recommended if
 *     you already have Flask installed locally).
 *  2. `E2E_FLASK_VERSION` — downloads that Flask release from GitHub into `.cache/` and
 *     unpacks it. Requires `curl` and `unzip` (present in the Nix dev shell).
 *
 * The release asset name varies between versions (e.g. `...-flask.0.zip` vs
 * `...-flask.0-browserify-deprecated.zip`), so the exact asset is discovered from the
 * GitHub release API instead of being assumed.
 */
export async function resolveFlaskPath(): Promise<string> {
  const explicit = process.env.E2E_METAMASK_PATH;
  if (explicit) {
    const dir = resolve(explicit);
    const found = findManifestDir(dir);
    if (!found) {
      throw new Error(
        `E2E_METAMASK_PATH="${dir}" does not contain a manifest.json. ` +
          `Point it at an unpacked MetaMask Flask build directory.`,
      );
    }
    return found;
  }

  const version = process.env.E2E_FLASK_VERSION;
  if (!version) {
    throw new Error(
      [
        'No MetaMask Flask build configured. Set ONE of these in packages/web-wallet/.env.e2e:',
        '  E2E_METAMASK_PATH=/abs/path/to/unpacked/metamask-flask',
        '  E2E_FLASK_VERSION=<version>   # a release from',
        '    https://github.com/MetaMask/metamask-extension/releases',
      ].join('\n'),
    );
  }

  const dest = join(CACHE_DIR, `flask-${version}`);
  const cached = existsSync(dest) ? findManifestDir(dest) : null;
  if (cached) return cached;

  mkdirSync(dest, { recursive: true });
  const assetUrl = await discoverFlaskAssetUrl(version);
  const zipPath = join(CACHE_DIR, `flask-${version}.zip`);

  try {
    // Argument arrays (no shell): `assetUrl`/`version` are dynamic, so never interpolate them
    // into a shell string.
    execFileSync('curl', ['-fL', '--retry', '3', '-o', zipPath, assetUrl], { stdio: 'inherit' });
    execFileSync('unzip', ['-o', '-q', zipPath, '-d', dest], { stdio: 'inherit' });
  } catch (err) {
    throw new Error(
      `Failed to download/unpack MetaMask Flask ${version} from ${assetUrl}. ` +
        `Verify the version exists, or set E2E_METAMASK_PATH instead. Cause: ${String(err)}`,
    );
  }

  const unpacked = findManifestDir(dest);
  if (!unpacked) {
    throw new Error(`Downloaded Flask ${version} but no manifest.json found under ${dest}.`);
  }
  return unpacked;
}

/**
 * Finds the GitHub release asset (a `metamask-flask-chrome-*.zip`) for the given version.
 * Prefers a non-"deprecated" build when several are published.
 */
async function discoverFlaskAssetUrl(version: string): Promise<string> {
  const api = `https://api.github.com/repos/MetaMask/metamask-extension/releases/tags/v${version}`;
  // Bound the request: this runs on the test-setup critical path, and fetch() has no default
  // timeout, so a stalled connection would hang setup until Playwright's outer timeout.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  const res = await fetch(api, {
    signal: controller.signal,
    headers: { 'User-Agent': 'hathor-web-wallet-e2e', Accept: 'application/vnd.github+json' },
  }).finally(() => clearTimeout(timer));
  if (!res.ok) {
    throw new Error(`GitHub API returned ${res.status} for ${api}. Is v${version} a real Flask release?`);
  }
  const release = (await res.json()) as {
    assets?: Array<{ name: string; browser_download_url: string }>;
  };
  const flaskZips = (release.assets ?? []).filter((a) =>
    /^metamask-flask-chrome-.*\.zip$/.test(a.name),
  );
  if (flaskZips.length === 0) {
    throw new Error(`Release v${version} has no metamask-flask-chrome-*.zip asset.`);
  }
  const preferred = flaskZips.find((a) => !/deprecated/i.test(a.name)) ?? flaskZips[0];
  return preferred.browser_download_url;
}

/** Returns the directory containing `manifest.json` (root or one level down), or null. */
function findManifestDir(root: string): string | null {
  if (!existsSync(root)) return null;
  if (existsSync(join(root, 'manifest.json'))) return root;
  for (const entry of readdirSync(root)) {
    const child = join(root, entry);
    if (statSync(child).isDirectory() && existsSync(join(child, 'manifest.json'))) {
      return child;
    }
  }
  return null;
}
