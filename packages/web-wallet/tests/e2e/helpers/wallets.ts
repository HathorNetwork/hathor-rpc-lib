import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(here, '..', 'wallets.config.json');

export type WalletEntry = {
  /** Secret Recovery Phrase of a STUB wallet (valid on any network). Empty string = not configured. */
  srp: string;
  description?: string;
};

type WalletsConfig = Record<string, WalletEntry>;

function load(): WalletsConfig {
  if (!existsSync(CONFIG_PATH)) return {};
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as WalletsConfig;
}

/** True when a wallet with this name has a non-empty seed configured. */
export function hasWallet(name: string): boolean {
  return Boolean(load()[name]?.srp);
}

/** Resolve a wallet name to its entry. Throws if missing/unconfigured — guard with hasWallet. */
export function lookupWallet(name: string): WalletEntry {
  const entry = load()[name];
  if (!entry?.srp) {
    throw new Error(
      `Wallet "${name}" is not configured in wallets.config.json (missing or empty srp). ` +
        `Either add it, or skip the journey with test.skip(!hasWallet("${name}"), ...).`,
    );
  }
  return entry;
}
