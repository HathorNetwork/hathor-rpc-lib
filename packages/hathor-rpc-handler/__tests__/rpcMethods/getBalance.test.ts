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
  let mockGetTokens: jest.Mock;

  function buildWallet(): IHathorWallet {
    return {
      getNetwork: jest.fn().mockReturnValue('testnet'),
      getBalance: mockGetBalance,
      getTokens: mockGetTokens,
    } as Partial<IHathorWallet> as IHathorWallet;
  }

  // getBalance must never invoke the prompt handler.
  const mockTriggerHandler = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBalance = jest.fn().mockResolvedValue(htrBalance);
    mockGetTokens = jest.fn().mockResolvedValue(['00']);
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

  it('should return every token the wallet holds (enumerated via getTokens) when tokens is omitted', async () => {
    const customTokenId = '000003521effbc8efd7b746a118cdc7d41d7cc1bf9c5d1fa5de4f8453f14ba4f';
    mockGetTokens.mockResolvedValueOnce(['00', customTokenId]);
    mockGetBalance
      .mockResolvedValueOnce(htrBalance)
      .mockResolvedValueOnce(customBalance);

    const request = {
      method: RpcMethods.GetBalance,
      params: { network: 'testnet' },
    } as GetBalanceRpcRequest;

    const result = await getBalance(request, buildWallet(), {}, mockTriggerHandler) as GetBalanceResponse;

    expect(mockGetTokens).toHaveBeenCalledTimes(1);
    expect(mockGetBalance).toHaveBeenCalledTimes(2);
    expect(mockGetBalance).toHaveBeenNthCalledWith(1, '00');
    expect(mockGetBalance).toHaveBeenNthCalledWith(2, customTokenId);
    expect(mockGetBalance).not.toHaveBeenCalledWith(null);
    expect(result.response).toHaveLength(2);
    expect(result.response[0].token.id).toBe('00');
    expect(result.response[1].token.id).toBe(customTokenId);
    expect(mockTriggerHandler).not.toHaveBeenCalled();
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
});
