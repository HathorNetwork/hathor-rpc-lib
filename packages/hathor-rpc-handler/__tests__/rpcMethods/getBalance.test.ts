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
    getBalance: jest.fn().mockResolvedValue([{
      token: {
        id: '000003521effbc8efd7b746a118cdc7d41d7cc1bf9c5d1fa5de4f8453f14ba4f'
      },
      balance: {
        unlocked: '0',
        locked: '0'
      },
      transactions: 0,
      lockExpires: null,
      tokenAuthorities: {
        unlocked: {
          mint: '0',
          melt: '0'
        },
        locked: {
          mint: '0',
          melt: '0'
        }
      }
    }]),
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

  it('should return flat array for multiple tokens', async () => {
    const token1Balance = [{
      token: {
        id: '00'
      },
      balance: {
        unlocked: '100',
        locked: '0'
      },
      transactions: 10,
      lockExpires: null,
      tokenAuthorities: {
        unlocked: {
          mint: '0',
          melt: '0'
        },
        locked: {
          mint: '0',
          melt: '0'
        }
      }
    }];

    const token2Balance = [{
      token: {
        id: '000003521effbc8efd7b746a118cdc7d41d7cc1bf9c5d1fa5de4f8453f14ba4f'
      },
      balance: {
        unlocked: '50',
        locked: '0'
      },
      transactions: 5,
      lockExpires: null,
      tokenAuthorities: {
        unlocked: {
          mint: '0',
          melt: '0'
        },
        locked: {
          mint: '0',
          melt: '0'
        }
      }
    }];

    mockWallet.getBalance
      .mockResolvedValueOnce(token1Balance)
      .mockResolvedValueOnce(token2Balance);

    const validRequest = {
      method: RpcMethods.GetBalance,
      params: {
        network: 'testnet',
        tokens: ['00', '000003521effbc8efd7b746a118cdc7d41d7cc1bf9c5d1fa5de4f8453f14ba4f'],
      },
    } as GetBalanceRpcRequest;

    const result = await getBalance(validRequest, mockWallet, {}, mockTriggerHandler);

    expect(result.response).toHaveLength(2);
    expect((result.response as any)[0].token.id).toBe('00');
    expect((result.response as any)[1].token.id).toBe('000003521effbc8efd7b746a118cdc7d41d7cc1bf9c5d1fa5de4f8453f14ba4f');
    expect(mockWallet.getBalance).toHaveBeenCalledTimes(2);
    expect(mockWallet.getBalance).toHaveBeenCalledWith('00');
    expect(mockWallet.getBalance).toHaveBeenCalledWith('000003521effbc8efd7b746a118cdc7d41d7cc1bf9c5d1fa5de4f8453f14ba4f');
  });
});
