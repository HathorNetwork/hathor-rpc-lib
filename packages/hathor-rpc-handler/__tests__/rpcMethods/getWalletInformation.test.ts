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
  RpcResponseTypes,
} from '../../src/types';
import { getWalletInformation } from '../../src/rpcMethods/getWalletInformation';
import { InvalidParamsError } from '../../src/errors';

describe('getWalletInformation parameter validation', () => {
  const mockWallet = {
    getNetwork: jest.fn().mockReturnValue('testnet'),
    getAddressAtIndex: jest.fn().mockResolvedValue('test-address'),
  } as Partial<IHathorWallet> as IHathorWallet;

  const mockTriggerHandler = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject when method is missing', async () => {
    const invalidRequest = {
      // method is missing
    } as GetWalletInformationRpcRequest;

    await expect(
      getWalletInformation(invalidRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when method is invalid', async () => {
    const invalidRequest = {
      method: 'invalid_method',
    } as unknown as GetWalletInformationRpcRequest;

    await expect(
      getWalletInformation(invalidRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should accept valid request and return wallet information', async () => {
    const validRequest = {
      method: RpcMethods.GetWalletInformation,
    } as GetWalletInformationRpcRequest;

    const result = await getWalletInformation(validRequest, mockWallet, {}, mockTriggerHandler);

    expect(result).toBeDefined();
    expect(result.type).toBe(RpcResponseTypes.GetWalletInformationResponse);
    expect(result.response).toEqual({
      network: 'testnet',
      address0: 'test-address',
    });
    expect(mockWallet.getNetwork).toHaveBeenCalled();
    expect(mockWallet.getAddressAtIndex).toHaveBeenCalledWith(0);
  });

  it('should work with different network', async () => {
    const mockMainnetWallet = {
      getNetwork: jest.fn().mockReturnValue('mainnet'),
      getAddressAtIndex: jest.fn().mockImplementation((addressIndex: number) => {
        if (addressIndex === 0) return 'HTestAddress123';
        throw new Error('Forbidden');
      }),
    } as Partial<IHathorWallet> as IHathorWallet;
    const validRequest = {
      method: RpcMethods.GetWalletInformation,
    } as GetWalletInformationRpcRequest;

    const result = await getWalletInformation(validRequest, mockMainnetWallet, {}, mockTriggerHandler);

    expect(result.response).toEqual({
      network: 'mainnet',
      address0: 'HTestAddress123',
    });
  });
});
