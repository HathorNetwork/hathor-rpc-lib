import { describe, it, expect, vi } from 'vitest';
import { setImmediate as setImmediateShim, clearImmediate as clearImmediateShim } from '../setImmediate.shim';

describe('setImmediate shim', () => {
  it('installs setImmediate and clearImmediate on the global object', () => {
    expect(typeof (globalThis as { setImmediate?: unknown }).setImmediate).toBe('function');
    expect(typeof (globalThis as { clearImmediate?: unknown }).clearImmediate).toBe('function');
  });

  it('invokes the callback asynchronously, never synchronously', async () => {
    let called = false;
    setImmediateShim(() => {
      called = true;
    });
    expect(called).toBe(false);
    await vi.waitFor(() => expect(called).toBe(true));
  });

  it('passes trailing arguments through to the callback', async () => {
    const args = await new Promise<number[]>((resolve) => {
      setImmediateShim((a: number, b: number) => resolve([a, b]), 1, 2);
    });
    expect(args).toEqual([1, 2]);
  });

  it('runs scheduled callbacks in FIFO order', async () => {
    const order: number[] = [];
    await new Promise<void>((resolve) => {
      setImmediateShim(() => order.push(1));
      setImmediateShim(() => order.push(2));
      setImmediateShim(() => {
        order.push(3);
        resolve();
      });
    });
    expect(order).toEqual([1, 2, 3]);
  });

  it('clearImmediate cancels a callback that has not run yet', async () => {
    let called = false;
    const handle = setImmediateShim(() => {
      called = true;
    });
    clearImmediateShim(handle);
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(called).toBe(false);
  });
});
