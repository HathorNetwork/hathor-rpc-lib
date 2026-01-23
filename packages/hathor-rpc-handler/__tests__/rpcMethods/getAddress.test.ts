/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IHathorWallet } from '@hathor/wallet-lib';
import { 
  RpcMethods,
  GetAddressRpcRequest,
  TriggerResponseTypes,
  AddressRequestClientResponse,
} from '../../src/types';
import { getAddress } from '../../src/rpcMethods/getAddress';
import { InvalidParamsError, NotImplementedError, PromptRejectedError } from '../../src/errors';

describe('getAddress parameter validation', () => {
  const mockWallet: Partial<IHathorWallet> = {
    getNetwork: jest.fn().mockReturnValue('testnet'),
    getCurrentAddress: jest.fn().mockResolvedValue('test-address'),
    getAddressAtIndex: jest.fn().mockResolvedValue('test-address'),
    getAddressPathForIndex: jest.fn().mockResolvedValue('m\'/44\'/0\'/0/1'),
    getAddressIndex: jest.fn().mockResolvedValue(1),
  };

  const mockTriggerHandler = jest.fn().mockResolvedValue({ data: true });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject when network is missing', async () => {
    const invalidRequest = {
      method: RpcMethods.GetAddress,
      params: {
        type: 'first_empty',
        // network is missing
      },
    } as GetAddressRpcRequest;

    await expect(
      getAddress(invalidRequest, mockWallet as IHathorWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when type is invalid', async () => {
    const invalidRequest = {
      method: RpcMethods.GetAddress,
      params: {
        type: 'invalid_type',
        network: 'testnet',
      },
    } as unknown as GetAddressRpcRequest;

    await expect(
      getAddress(invalidRequest, mockWallet as IHathorWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when type is index but index is missing', async () => {
    const invalidRequest = {
      method: RpcMethods.GetAddress,
      params: {
        type: 'index',
        network: 'testnet',
        // index is missing
      },
    } as GetAddressRpcRequest;

    await expect(
      getAddress(invalidRequest, mockWallet as IHathorWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when type is index but index is negative', async () => {
    const invalidRequest = {
      method: RpcMethods.GetAddress,
      params: {
        type: 'index',
        network: 'testnet',
        index: -1,
      },
    } as GetAddressRpcRequest;

    await expect(
      getAddress(invalidRequest, mockWallet as IHathorWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when type is full_path but full_path is missing', async () => {
    const invalidRequest = {
      method: RpcMethods.GetAddress,
      params: {
        type: 'full_path',
        network: 'testnet',
        // full_path is missing
      },
    } as GetAddressRpcRequest;

    await expect(
      getAddress(invalidRequest, mockWallet as IHathorWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when type is full_path but full_path is empty', async () => {
    const invalidRequest = {
      method: RpcMethods.GetAddress,
      params: {
        type: 'full_path',
        network: 'testnet',
        full_path: '',
      },
    } as GetAddressRpcRequest;

    await expect(
      getAddress(invalidRequest, mockWallet as IHathorWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should throw NotImplementedError when type is full_path', async () => {
    const request = {
      method: RpcMethods.GetAddress,
      params: {
        type: 'full_path',
        network: 'testnet',
        full_path: 'm/44/0/0',
      },
    } as GetAddressRpcRequest;

    await expect(
      getAddress(request, mockWallet as IHathorWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(NotImplementedError);
  });

  it('should accept valid first_empty request', async () => {
    const validRequest = {
      method: RpcMethods.GetAddress,
      params: {
        type: 'first_empty',
        network: 'testnet',
      },
    } as GetAddressRpcRequest;

    await expect(
      getAddress(validRequest, mockWallet as IHathorWallet, {}, mockTriggerHandler)
    ).resolves.toBeDefined();

    expect(mockWallet.getCurrentAddress).toHaveBeenCalled();
  });

  it('should accept valid index request', async () => {
    const validRequest = {
      method: RpcMethods.GetAddress,
      params: {
        type: 'index',
        network: 'testnet',
        index: 0,
      },
    } as GetAddressRpcRequest;

    await expect(
      getAddress(validRequest, mockWallet as IHathorWallet, {}, mockTriggerHandler)
    ).resolves.toBeDefined();

    expect(mockWallet.getAddressAtIndex).toHaveBeenCalledWith(0);
  });

  it('should accept valid client request', async () => {
    const validRequest = {
      method: RpcMethods.GetAddress,
      params: {
        type: 'client',
        network: 'testnet',
      },
    } as GetAddressRpcRequest;

    mockTriggerHandler.mockResolvedValueOnce({
      type: TriggerResponseTypes.AddressRequestClientResponse,
      data: {
        address: 'client-address',
      },
    } as AddressRequestClientResponse);

    await expect(
      getAddress(validRequest, mockWallet as IHathorWallet, {}, mockTriggerHandler)
    ).resolves.toBeDefined();
  });

  it('should throw PromptRejectedError when user rejects non-client address', async () => {
    const validRequest = {
      method: RpcMethods.GetAddress,
      params: {
        type: 'first_empty',
        network: 'testnet',
      },
    } as GetAddressRpcRequest;

    mockTriggerHandler.mockResolvedValueOnce(false);

    await expect(
      getAddress(validRequest, mockWallet as IHathorWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(PromptRejectedError);
  });
});
