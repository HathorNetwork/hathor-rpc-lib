import type { RequestArguments } from '@metamask/providers';

import { useMetaMaskContext } from './MetamaskContext';

export type Request = (params: { method: string; params?: unknown }) => Promise<unknown | null>;

/**
 * Utility hook to consume the provider `request` method with the available provider.
 *
 * @returns The `request` function.
 */
export const useRequest = () => {
  const { provider, setError } = useMetaMaskContext();

  /**
   * `provider.request` wrapper.
   *
   * @param params - The request params.
   * @param params.method - The method to call.
   * @param params.params - The method params.
   * @returns The result of the request.
   * @throws Will throw an error if the request fails.
   */
  const request: Request = async ({ method, params }) => {
    try {
      setError(null);
      const data =
        (await provider?.request({
          method,
          params: params as RequestArguments['params'],
        })) ?? null;

      return data;
    } catch (requestError: any) {
      // Normalize error to an Error instance for UI notifications.
      // MetaMask provider errors are often plain objects (e.g. {code: 4001, message: "..."})
      // which would render as "[object Object]" if not normalized.
      const normalizedError = requestError instanceof Error
        ? requestError
        : new Error(requestError?.message || String(requestError));
      setError(normalizedError);

      // Re-throw the error so callers can distinguish between
      // null response vs error. This allows proper error handling
      // instead of treating all errors as null responses.
      throw requestError;
    }
  };

  return request;
};