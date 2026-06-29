/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IHathorWallet } from '@hathor/wallet-lib';
import {
  RpcMethods,
  GetWalletInformationRpcRequest,
  GetWalletInformationResponse,
  RpcResponseTypes,
} from '../../src/types';
import { getWalletInformation } from '../../src/rpcMethods/getWalletInformation';
import { InvalidParamsError } from '../../src/errors';

describe('getWalletInformation', () => {
  const customTokenId = '000003521effbc8efd7b746a118cdc7d41d7cc1bf9c5d1fa5de4f8453f14ba4f';

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
    token: { id: customTokenId },
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
  let mockGetNetwork: jest.Mock;
  let mockGetAddressAtIndex: jest.Mock;

  function buildWallet(): IHathorWallet {
    return {
      getNetwork: mockGetNetwork,
      getAddressAtIndex: mockGetAddressAtIndex,
      getBalance: mockGetBalance,
      getTokens: mockGetTokens,
    } as Partial<IHathorWallet> as IHathorWallet;
  }

  // getWalletInformation must never invoke the prompt handler.
  const mockTriggerHandler = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNetwork = jest.fn().mockReturnValue('testnet');
    mockGetAddressAtIndex = jest.fn().mockResolvedValue('test-address');
    mockGetBalance = jest.fn().mockResolvedValue(htrBalance);
    mockGetTokens = jest.fn().mockResolvedValue(['00']);
  });

  it('should reject when method is missing', async () => {
    const invalidRequest = {
      // method is missing
    } as GetWalletInformationRpcRequest;

    await expect(
      getWalletInformation(invalidRequest, buildWallet(), {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when method is invalid', async () => {
    const invalidRequest = {
      method: 'invalid_method',
    } as unknown as GetWalletInformationRpcRequest;

    await expect(
      getWalletInformation(invalidRequest, buildWallet(), {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when tokens array is empty', async () => {
    const invalidRequest = {
      method: RpcMethods.GetWalletInformation,
      params: { tokens: [] },
    } as GetWalletInformationRpcRequest;

    await expect(
      getWalletInformation(invalidRequest, buildWallet(), {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when tokens array contains empty strings', async () => {
    const invalidRequest = {
      method: RpcMethods.GetWalletInformation,
      params: { tokens: ['00', ''] },
    } as GetWalletInformationRpcRequest;

    await expect(
      getWalletInformation(invalidRequest, buildWallet(), {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should return network, address0 and the balance of every token the wallet holds when tokens is omitted', async () => {
    mockGetTokens.mockResolvedValueOnce(['00', customTokenId]);
    mockGetBalance
      .mockResolvedValueOnce(htrBalance)
      .mockResolvedValueOnce(customBalance);

    const validRequest = {
      method: RpcMethods.GetWalletInformation,
    } as GetWalletInformationRpcRequest;

    const result = await getWalletInformation(
      validRequest, buildWallet(), {}, mockTriggerHandler,
    ) as GetWalletInformationResponse;

    expect(result.type).toBe(RpcResponseTypes.GetWalletInformationResponse);
    expect(result.response.network).toBe('testnet');
    expect(result.response.address0).toBe('test-address');
    expect(mockGetTokens).toHaveBeenCalledTimes(1);
    expect(mockGetBalance).toHaveBeenCalledTimes(2);
    expect(mockGetBalance).toHaveBeenNthCalledWith(1, '00');
    expect(mockGetBalance).toHaveBeenNthCalledWith(2, customTokenId);
    expect(mockGetBalance).not.toHaveBeenCalledWith(null);
    expect(result.response.balance).toHaveLength(2);
    expect(result.response.balance[0].token.id).toBe('00');
    expect(result.response.balance[1].token.id).toBe(customTokenId);
    expect(mockTriggerHandler).not.toHaveBeenCalled();
  });

  it('should return the balance for the requested subset of tokens', async () => {
    mockGetBalance
      .mockResolvedValueOnce(htrBalance)
      .mockResolvedValueOnce(customBalance);

    const validRequest = {
      method: RpcMethods.GetWalletInformation,
      params: { tokens: ['00', customTokenId] },
    } as GetWalletInformationRpcRequest;

    const result = await getWalletInformation(
      validRequest, buildWallet(), {}, mockTriggerHandler,
    ) as GetWalletInformationResponse;

    expect(mockGetTokens).not.toHaveBeenCalled();
    expect(mockGetBalance).toHaveBeenCalledTimes(2);
    expect(result.response.balance).toHaveLength(2);
    expect(result.response.balance[0].token.id).toBe('00');
    expect(result.response.balance[1].token.id).toBe(customTokenId);
  });

  it('should NOT prompt the user (triggerHandler never called)', async () => {
    const validRequest = {
      method: RpcMethods.GetWalletInformation,
      params: { tokens: ['00'] },
    } as GetWalletInformationRpcRequest;

    await getWalletInformation(validRequest, buildWallet(), {}, mockTriggerHandler);

    expect(mockTriggerHandler).not.toHaveBeenCalled();
  });

  it('should work with a different network', async () => {
    mockGetNetwork.mockReturnValue('mainnet');
    mockGetAddressAtIndex.mockResolvedValue('HTestAddress123');

    const validRequest = {
      method: RpcMethods.GetWalletInformation,
    } as GetWalletInformationRpcRequest;

    const result = await getWalletInformation(
      validRequest, buildWallet(), {}, mockTriggerHandler,
    ) as GetWalletInformationResponse;

    expect(result.response.network).toBe('mainnet');
    expect(result.response.address0).toBe('HTestAddress123');
    expect(result.response.balance).toEqual(htrBalance);
    expect(mockGetAddressAtIndex).toHaveBeenCalledWith(0);
  });
});
