/**
 * Races a promise against a timeout, automatically clearing the timeout when the promise resolves.
 * This prevents unhandled promise rejections from lingering timeouts.
 *
 * @param promise - The promise to race
 * @param timeoutMs - Timeout duration in milliseconds
 * @param timeoutErrorMessage - Error message to throw on timeout
 * @returns The result of the promise if it resolves before the timeout
 * @throws Error with timeoutErrorMessage if the timeout occurs first
 */
export async function raceWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutErrorMessage: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutErrorMessage)), timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}
