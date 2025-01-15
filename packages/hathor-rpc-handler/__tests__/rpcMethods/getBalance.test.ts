/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from '@hathor/wallet-lib';
import { 
  RpcMethods,
  GetBalanceRpcRequest,
} from '../../src/types';
import { getBalance } from '../../src/rpcMethods/getBalance';
import { InvalidParamsError, NotImplementedError } from '../../src/errors';

describe('getBalance parameter validation', () => {
  const mockWallet = {
    getNetwork: jest.fn().mockReturnValue('testnet'),
    getBalance: jest.fn().mockResolvedValue({
      available: 100,
      locked: 0,
    }),
  } as unknown as HathorWallet;

  const mockTriggerHandler = jest.fn().mockResolvedValue(true);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject when network is missing', async () => {
    const invalidRequest = {
      method: RpcMethods.GetBalance,
      params: {
        tokens: ['HTR'],
        // network is missing
      },
    } as GetBalanceRpcRequest;

    await expect(
      getBalance(invalidRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when tokens array is empty', async () => {
    const invalidRequest = {
      method: RpcMethods.GetBalance,
      params: {
        network: 'testnet',
        tokens: [],
      },
    } as GetBalanceRpcRequest;

    await expect(
      getBalance(invalidRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when tokens array contains empty strings', async () => {
    const invalidRequest = {
      method: RpcMethods.GetBalance,
      params: {
        network: 'testnet',
        tokens: ['HTR', ''],
      },
    } as GetBalanceRpcRequest;

    await expect(
      getBalance(invalidRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when addressIndexes contains negative numbers', async () => {
    const invalidRequest = {
      method: RpcMethods.GetBalance,
      params: {
        network: 'testnet',
        tokens: ['HTR'],
        addressIndexes: [-1],
      },
    } as GetBalanceRpcRequest;

    await expect(
      getBalance(invalidRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should throw NotImplementedError when addressIndexes is provided', async () => {
    const request = {
      method: RpcMethods.GetBalance,
      params: {
        network: 'testnet',
        tokens: ['HTR'],
        addressIndexes: [0],
      },
    } as GetBalanceRpcRequest;

    await expect(
      getBalance(request, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(NotImplementedError);
  });

  it('should accept valid parameters', async () => {
    const validRequest = {
      method: RpcMethods.GetBalance,
      params: {
        network: 'testnet',
        tokens: ['HTR'],
      },
    } as GetBalanceRpcRequest;

    await expect(
      getBalance(validRequest, mockWallet, {}, mockTriggerHandler)
    ).resolves.toBeDefined();

    expect(mockWallet.getBalance).toHaveBeenCalledWith('HTR');
  });
});
