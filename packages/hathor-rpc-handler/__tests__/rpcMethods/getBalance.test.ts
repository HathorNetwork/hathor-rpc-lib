/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IHathorWallet } from '@hathor/wallet-lib';
import {
  RpcMethods,
  GetBalanceRpcRequest,
  GetBalanceResponse,
} from '../../src/types';
import { getBalance } from '../../src/rpcMethods/getBalance';
import { InvalidParamsError, NotImplementedError } from '../../src/errors';

describe('getBalance', () => {
  const htrBalance = [{
    token: { id: '00' },
    balance: { unlocked: '100', locked: '0' },
    transactions: 10,
    lockExpires: null,
    tokenAuthorities: {
      unlocked: { mint: '0', melt: '0' },
      locked: { mint: '0', melt: '0' },
    },
  }];

  const customBalance = [{
    token: { id: '000003521effbc8efd7b746a118cdc7d41d7cc1bf9c5d1fa5de4f8453f14ba4f' },
    balance: { unlocked: '50', locked: '0' },
    transactions: 5,
    lockExpires: null,
    tokenAuthorities: {
      unlocked: { mint: '0', melt: '0' },
      locked: { mint: '0', melt: '0' },
    },
  }];

  let mockGetBalance: jest.Mock;
  let registeredTokens: { uid: string }[];

  function buildWallet(): IHathorWallet {
    return {
      getNetwork: jest.fn().mockReturnValue('testnet'),
      getBalance: mockGetBalance,
      storage: {
        getRegisteredTokens: async function* getRegisteredTokens() {
          for (const t of registeredTokens) {
            yield t;
          }
        },
      },
    } as unknown as IHathorWallet;
  }

  // getBalance must never invoke the prompt handler.
  const mockTriggerHandler = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBalance = jest.fn().mockResolvedValue(htrBalance);
    // getRegisteredTokens() yields only explicitly-registered custom tokens,
    // never the native HTR token.
    registeredTokens = [];
  });

  it('should reject when network is missing', async () => {
    const invalidRequest = {
      method: RpcMethods.GetBalance,
      params: { tokens: ['HTR'] },
    } as GetBalanceRpcRequest;

    await expect(
      getBalance(invalidRequest, buildWallet(), {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when tokens array is empty', async () => {
    const invalidRequest = {
      method: RpcMethods.GetBalance,
      params: { network: 'testnet', tokens: [] },
    } as GetBalanceRpcRequest;

    await expect(
      getBalance(invalidRequest, buildWallet(), {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when tokens array contains empty strings', async () => {
    const invalidRequest = {
      method: RpcMethods.GetBalance,
      params: { network: 'testnet', tokens: ['HTR', ''] },
    } as GetBalanceRpcRequest;

    await expect(
      getBalance(invalidRequest, buildWallet(), {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should throw NotImplementedError when addressIndexes is provided', async () => {
    const request = {
      method: RpcMethods.GetBalance,
      params: { network: 'testnet', tokens: ['HTR'], addressIndexes: [0] },
    } as GetBalanceRpcRequest;

    await expect(
      getBalance(request, buildWallet(), {}, mockTriggerHandler)
    ).rejects.toThrow(NotImplementedError);
  });

  it('should reject when addressIndexes contains negative numbers', async () => {
    const invalidRequest = {
      method: RpcMethods.GetBalance,
      params: { network: 'testnet', tokens: ['HTR'], addressIndexes: [-1] },
    } as GetBalanceRpcRequest;

    await expect(
      getBalance(invalidRequest, buildWallet(), {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should return only the native token (HTR) when no custom tokens are registered', async () => {
    registeredTokens = [];

    const request = {
      method: RpcMethods.GetBalance,
      params: { network: 'testnet' },
    } as GetBalanceRpcRequest;

    const result = await getBalance(request, buildWallet(), {}, mockTriggerHandler) as GetBalanceResponse;

    expect(mockGetBalance).toHaveBeenCalledTimes(1);
    expect(mockGetBalance).toHaveBeenCalledWith('00');
    expect(result.response).toHaveLength(1);
    expect(result.response[0].token.id).toBe('00');
  });

  it('should NOT prompt the user (triggerHandler never called)', async () => {
    const validRequest = {
      method: RpcMethods.GetBalance,
      params: { network: 'testnet', tokens: ['00'] },
    } as GetBalanceRpcRequest;

    await getBalance(validRequest, buildWallet(), {}, mockTriggerHandler);

    expect(mockTriggerHandler).not.toHaveBeenCalled();
  });

  it('should return balance for the requested subset of tokens', async () => {
    mockGetBalance
      .mockResolvedValueOnce(htrBalance)
      .mockResolvedValueOnce(customBalance);

    const validRequest = {
      method: RpcMethods.GetBalance,
      params: {
        network: 'testnet',
        tokens: ['00', '000003521effbc8efd7b746a118cdc7d41d7cc1bf9c5d1fa5de4f8453f14ba4f'],
      },
    } as GetBalanceRpcRequest;

    const result = await getBalance(validRequest, buildWallet(), {}, mockTriggerHandler) as GetBalanceResponse;

    expect(result.response).toHaveLength(2);
    expect(result.response[0].token.id).toBe('00');
    expect(result.response[1].token.id).toBe('000003521effbc8efd7b746a118cdc7d41d7cc1bf9c5d1fa5de4f8453f14ba4f');
    expect(mockGetBalance).toHaveBeenCalledTimes(2);
  });

  it('should return the native token (HTR) plus all registered tokens when tokens is omitted', async () => {
    registeredTokens = [
      { uid: '000003521effbc8efd7b746a118cdc7d41d7cc1bf9c5d1fa5de4f8453f14ba4f' },
    ];
    mockGetBalance
      .mockResolvedValueOnce(htrBalance)
      .mockResolvedValueOnce(customBalance);

    const request = {
      method: RpcMethods.GetBalance,
      params: { network: 'testnet' },
    } as GetBalanceRpcRequest;

    const result = await getBalance(request, buildWallet(), {}, mockTriggerHandler) as GetBalanceResponse;

    expect(mockGetBalance).toHaveBeenCalledTimes(2);
    expect(mockGetBalance).toHaveBeenNthCalledWith(1, '00');
    expect(mockGetBalance).toHaveBeenNthCalledWith(2, '000003521effbc8efd7b746a118cdc7d41d7cc1bf9c5d1fa5de4f8453f14ba4f');
    expect(result.response).toHaveLength(2);
    expect(result.response[0].token.id).toBe('00');
    expect(result.response[1].token.id).toBe('000003521effbc8efd7b746a118cdc7d41d7cc1bf9c5d1fa5de4f8453f14ba4f');
    expect(mockTriggerHandler).not.toHaveBeenCalled();
  });

  it('should not duplicate HTR if it is also yielded by getRegisteredTokens', async () => {
    // Defensive: HTR must be requested exactly once even if it is also registered.
    registeredTokens = [
      { uid: '00' },
      { uid: '000003521effbc8efd7b746a118cdc7d41d7cc1bf9c5d1fa5de4f8453f14ba4f' },
    ];
    mockGetBalance
      .mockResolvedValueOnce(htrBalance)
      .mockResolvedValueOnce(customBalance);

    const request = {
      method: RpcMethods.GetBalance,
      params: { network: 'testnet' },
    } as GetBalanceRpcRequest;

    const result = await getBalance(request, buildWallet(), {}, mockTriggerHandler) as GetBalanceResponse;

    expect(mockGetBalance).toHaveBeenCalledTimes(2);
    expect(mockGetBalance).toHaveBeenNthCalledWith(1, '00');
    expect(mockGetBalance).toHaveBeenNthCalledWith(2, '000003521effbc8efd7b746a118cdc7d41d7cc1bf9c5d1fa5de4f8453f14ba4f');
    expect(result.response).toHaveLength(2);
  });
});
