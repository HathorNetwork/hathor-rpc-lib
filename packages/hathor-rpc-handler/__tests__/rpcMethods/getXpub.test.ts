/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from '@hathor/wallet-lib';
import {
  RpcMethods,
  GetXpubRpcRequest,
  RpcResponseTypes,
  TriggerTypes,
} from '../../src/types';
import { getXpub } from '../../src/rpcMethods/getXpub';
import { InvalidParamsError, PromptRejectedError, DifferentNetworkError } from '../../src/errors';

describe('getXpub parameter validation', () => {
  const mockXpub = 'xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVJrZwQY4VUNgqFJPMM3No2dFDFGTsxxpG5uJh7n7epu4trkrX7x7DogT5Uv6fcLW5';

  const mockWallet = {
    getNetwork: jest.fn().mockReturnValue('testnet'),
    xpub: mockXpub,
  } as unknown as HathorWallet;

  const mockTriggerHandler = jest.fn().mockResolvedValue({ data: true });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject when network is missing', async () => {
    const invalidRequest = {
      method: RpcMethods.GetXpub,
      params: {
        // network is missing
      },
    } as GetXpubRpcRequest;

    await expect(
      getXpub(invalidRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when network is empty', async () => {
    const invalidRequest = {
      method: RpcMethods.GetXpub,
      params: {
        network: '',
      },
    } as GetXpubRpcRequest;

    await expect(
      getXpub(invalidRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when network does not match wallet network', async () => {
    const invalidRequest = {
      method: RpcMethods.GetXpub,
      params: {
        network: 'mainnet',
      },
    } as GetXpubRpcRequest;

    await expect(
      getXpub(invalidRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(DifferentNetworkError);
  });

  it('should throw error when wallet xpub is not available', async () => {
    const walletWithoutXpub = {
      getNetwork: jest.fn().mockReturnValue('testnet'),
      xpub: undefined,
    } as unknown as HathorWallet;

    const validRequest = {
      method: RpcMethods.GetXpub,
      params: {
        network: 'testnet',
      },
    } as GetXpubRpcRequest;

    await expect(
      getXpub(validRequest, walletWithoutXpub, {}, mockTriggerHandler)
    ).rejects.toThrow('Wallet xpub is not available');
  });

  it('should accept valid request and return xpub', async () => {
    const validRequest = {
      method: RpcMethods.GetXpub,
      params: {
        network: 'testnet',
      },
    } as GetXpubRpcRequest;

    const result = await getXpub(validRequest, mockWallet, {}, mockTriggerHandler);

    expect(result).toBeDefined();
    expect(result.type).toBe(RpcResponseTypes.GetXpubResponse);
    expect(result.response).toEqual({
      xpub: mockXpub,
    });
  });

  it('should call trigger handler with correct params', async () => {
    const validRequest = {
      method: RpcMethods.GetXpub,
      params: {
        network: 'testnet',
      },
    } as GetXpubRpcRequest;

    await getXpub(validRequest, mockWallet, {}, mockTriggerHandler);

    expect(mockTriggerHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        method: RpcMethods.GetXpub,
        type: TriggerTypes.GetXpubConfirmationPrompt,
        data: { xpub: mockXpub },
      }),
      {}
    );
  });

  it('should throw PromptRejectedError when user rejects', async () => {
    const validRequest = {
      method: RpcMethods.GetXpub,
      params: {
        network: 'testnet',
      },
    } as GetXpubRpcRequest;

    mockTriggerHandler.mockResolvedValueOnce({ data: false });

    await expect(
      getXpub(validRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(PromptRejectedError);
  });

  it('should validate network before prompting user', async () => {
    const invalidRequest = {
      method: RpcMethods.GetXpub,
      params: {
        network: 'mainnet',
      },
    } as GetXpubRpcRequest;

    await expect(
      getXpub(invalidRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow();

    // Should not call trigger handler if network validation fails
    expect(mockTriggerHandler).not.toHaveBeenCalled();
  });
});
