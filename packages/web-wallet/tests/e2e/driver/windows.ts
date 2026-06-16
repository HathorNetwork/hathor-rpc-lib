import type { BrowserContext, Page } from '@playwright/test';

/**
 * When `E2E_SPLIT_WINDOWS=1`, the suite places the MetaMask UI and the Hathor wallet in two
 * separate, side-by-side OS windows (instead of tabs in one window) so a headed run is easier
 * to watch. Both windows live in the SAME persistent context: loading the extension requires a
 * single context and MetaMask must inject its provider into the dApp page, so this is one
 * browser with two windows, not two browsers (which cannot share the extension/provider).
 *
 * Implemented via the Chrome DevTools Protocol (Chromium-only): `Target.createTarget` with
 * `newWindow` opens a page in a fresh window, and `Browser.setWindowBounds` tiles the windows.
 */
export const SPLIT_WINDOWS = process.env.E2E_SPLIT_WINDOWS === '1';

/**
 * Opens a blank page in a brand-new OS window and returns it once the context registers it.
 * `anchor` is any existing page, used only to obtain a CDP session.
 */
export async function openPageInNewWindow(context: BrowserContext, anchor: Page): Promise<Page> {
  const cdp = await context.newCDPSession(anchor);
  // Match only our blank window — MetaMask's own (re)opened tabs are always chrome-extension://,
  // so this can't accidentally adopt one if the extension opens a tab at the same moment.
  const created = context.waitForEvent('page', {
    predicate: (p) => p.url() === 'about:blank' || p.url() === '',
    timeout: 15_000,
  });
  await cdp.send('Target.createTarget', { url: 'about:blank', newWindow: true });
  const page = await created;
  await cdp.detach().catch(() => undefined);
  return page;
}

/**
 * Tiles two windows across the available screen: the window holding `left` gets `leftFraction`
 * of the width (default half), the window holding `right` gets the rest. Best-effort — window
 * placement is a viewing nicety, so any CDP failure is swallowed rather than failing the run.
 */
export async function tileSideBySide(
  context: BrowserContext,
  left: Page,
  right: Page,
  leftFraction = 0.5,
): Promise<void> {
  // Anchor to the monitor where `right` currently is: availLeft/availTop are that monitor's
  // origin in the virtual-desktop coordinate space. Positioning relative to it keeps both
  // windows on that monitor instead of yanking them to the primary monitor's (0,0).
  const screen = await right
    .evaluate(() => {
      const s = window.screen as Screen & { availLeft?: number; availTop?: number };
      return { w: s.availWidth, h: s.availHeight, x: s.availLeft ?? 0, y: s.availTop ?? 0 };
    })
    .catch(() => ({ w: 1440, h: 900, x: 0, y: 0 }));
  const leftWidth = Math.floor(screen.w * leftFraction);
  const rightWidth = screen.w - leftWidth;
  await setWindowBounds(context, left, {
    left: screen.x,
    top: screen.y,
    width: leftWidth,
    height: screen.h,
  });
  const actual = await setWindowBounds(context, right, {
    left: screen.x + leftWidth,
    top: screen.y,
    width: rightWidth,
    height: screen.h,
  });
  // Chrome enforces a minimum window width (~500px). If `right` came back wider than asked, it
  // would spill past the monitor's right edge — pull it flush-right so it stays fully visible
  // (it then overlaps the left window's far edge instead of clipping off-screen).
  if (actual && actual.width > rightWidth) {
    await setWindowBounds(context, right, {
      left: screen.x + screen.w - actual.width,
      top: screen.y,
      width: actual.width,
      height: screen.h,
    });
  }
}

/**
 * Waits briefly for a MetaMask page (a `chrome-extension://` URL) to exist and returns it,
 * or undefined if none appears. Used to anchor tiling on MetaMask's REAL window rather than
 * on whatever stray `about:blank` Chromium/Playwright opened first.
 */
export async function waitForMetaMaskPage(
  context: BrowserContext,
  timeoutMs = 10_000,
): Promise<Page | undefined> {
  const isMM = (p: Page) => p.url().startsWith('chrome-extension://');
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const found = context.pages().find(isMM);
    if (found) return found;
    if (Date.now() >= deadline) return undefined;
    await new Promise((r) => setTimeout(r, 200));
  }
}

/**
 * Closes leftover blank pages — chiefly the persistent context's initial `about:blank`, which
 * is orphaned once MetaMask opens its own tab and the wallet gets its own window. `keep` (the
 * wallet page, still `about:blank` until it navigates) is preserved.
 */
export async function closeStrayBlankPages(context: BrowserContext, keep: Page): Promise<void> {
  for (const p of context.pages()) {
    if (p === keep) continue;
    const url = p.url();
    if (url === 'about:blank' || url === '') {
      await p.close().catch(() => undefined);
    }
  }
}

/** Logs each page's URL + CDP windowId + bounds (only when E2E_DEBUG=1) to diagnose layout. */
export async function dumpWindows(context: BrowserContext, label: string): Promise<void> {
  if (process.env.E2E_DEBUG !== '1') return;
  const lines: string[] = [];
  for (const p of context.pages()) {
    let info = 'win=?';
    try {
      const cdp = await context.newCDPSession(p);
      const { windowId, bounds } = await cdp.send('Browser.getWindowForTarget', {});
      await cdp.detach().catch(() => undefined);
      info = `win=${windowId} @${bounds.left},${bounds.top} ${bounds.width}x${bounds.height}`;
    } catch (e) {
      info = `win=? (${String(e).split('\n')[0]})`;
    }
    lines.push(`  [${info}] ${p.url() || '(blank)'}`);
  }
  console.log(`\n[windows:${label}] ${context.pages().length} page(s)\n${lines.join('\n')}`);
}

/** Sets a window's bounds and returns the ACTUAL bounds afterwards (Chrome may clamp them). */
async function setWindowBounds(
  context: BrowserContext,
  page: Page,
  bounds: { left: number; top: number; width: number; height: number },
): Promise<{ left: number; top: number; width: number; height: number } | undefined> {
  try {
    const cdp = await context.newCDPSession(page);
    const { windowId } = await cdp.send('Browser.getWindowForTarget', {});
    await cdp.send('Browser.setWindowBounds', {
      windowId,
      bounds: { ...bounds, windowState: 'normal' },
    });
    const { bounds: after } = await cdp.send('Browser.getWindowForTarget', {});
    await cdp.detach().catch(() => undefined);
    return {
      left: after.left ?? bounds.left,
      top: after.top ?? bounds.top,
      width: after.width ?? bounds.width,
      height: after.height ?? bounds.height,
    };
  } catch {
    // Best-effort: tiling is a nicety; never fail a run over window placement.
    return undefined;
  }
}
