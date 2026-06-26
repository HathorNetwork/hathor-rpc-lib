/**
 * MessageChannel-based replacement for the `setimmediate` package.
 *
 * The upstream `setimmediate` browser implementation schedules work through
 * `window.postMessage` and only runs the callback when it receives a message
 * whose `event.source === window`. Some wallet extensions proxy `event.source`,
 * so that check never matches and every `setImmediate` consumer silently stops
 * working — including React's scheduler, which prefers `setImmediate` over
 * `MessageChannel` whenever a global `setImmediate` exists. The result is a
 * blank screen with no error.
 *
 * A `MessageChannel` uses point-to-point ports with no `event.source` check, so
 * it is immune to that interference. This module is aliased over `setimmediate`
 * in webpack so the Node timer polyfills (timers-browserify, pulled in by
 * `@hathor/wallet-lib`) and React's scheduler both get a working `setImmediate`.
 */

type ImmediateCallback = (...args: unknown[]) => void;

interface ImmediateTask {
  callback: ImmediateCallback;
  args: unknown[];
}

const tasksByHandle = new Map<number, ImmediateTask>();
let nextHandle = 1;
let runningHandle: number | undefined;

function runIfPresent(handle: number): void {
  if (runningHandle !== undefined) {
    // A task is already running: defer to keep execution non-reentrant.
    setTimeout(runIfPresent, 0, handle);
    return;
  }
  const task = tasksByHandle.get(handle);
  if (!task) {
    return;
  }
  runningHandle = handle;
  try {
    task.callback(...task.args);
  } finally {
    runningHandle = undefined;
    tasksByHandle.delete(handle);
  }
}

const schedule: (handle: number) => void = (() => {
  if (typeof MessageChannel !== 'undefined') {
    const channel = new MessageChannel();
    channel.port1.onmessage = (event: MessageEvent) => {
      runIfPresent(event.data as number);
    };
    return (handle: number) => {
      channel.port2.postMessage(handle);
    };
  }
  return (handle: number) => {
    setTimeout(runIfPresent, 0, handle);
  };
})();

export function setImmediate(callback: ImmediateCallback, ...args: unknown[]): number {
  const handle = nextHandle;
  nextHandle += 1;
  tasksByHandle.set(handle, { callback, args });
  schedule(handle);
  return handle;
}

export function clearImmediate(handle: number): void {
  tasksByHandle.delete(handle);
}

// Install on the global as a side effect (mirroring the `setimmediate` package)
// so timers-browserify and React's scheduler pick up this implementation. The
// overwrite is unconditional, and this module is imported before `react-dom` in
// main.tsx, so it replaces any extension-injected polyfill before the scheduler
// reads `setImmediate`.
const globalScope = globalThis as unknown as {
  setImmediate?: unknown;
  clearImmediate?: unknown;
};
globalScope.setImmediate = setImmediate;
globalScope.clearImmediate = clearImmediate;
