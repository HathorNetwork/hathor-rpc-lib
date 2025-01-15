/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from '@hathor/wallet-lib';
import { 
  TriggerResponseTypes, 
  RpcMethods,
  SignWithAddressRpcRequest,
} from '../../src/types';
import { signWithAddress } from '../../src/rpcMethods/signWithAddress';
import { InvalidParamsError } from '../../src/errors';

describe('signWithAddress parameter validation', () => {
  const mockWallet = {
    getNetwork: jest.fn().mockReturnValue('testnet'),
    getAddressAtIndex: jest.fn().mockResolvedValue('test-address'),
    getAddressPathForIndex: jest.fn().mockResolvedValue('test-path'),
    signMessageWithAddress: jest.fn().mockResolvedValue('test-signature'),
  } as unknown as HathorWallet;

  const mockTriggerHandler = jest.fn().mockResolvedValue({
    type: TriggerResponseTypes.SignMessageWithAddressConfirmationResponse,
    data: { 
      accepted: true,
      pinCode: '1234'
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject when network is missing', async () => {
    const invalidRequest = {
      method: RpcMethods.SignWithAddress,
      params: {
        message: 'test-message',
        addressIndex: 0,
        // network is missing
      },
    } as SignWithAddressRpcRequest;

    await expect(
      signWithAddress(invalidRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when message is empty', async () => {
    const invalidRequest = {
      method: RpcMethods.SignWithAddress,
      params: {
        network: 'testnet',
        message: '',
        addressIndex: 0,
      },
    } as SignWithAddressRpcRequest;

    await expect(
      signWithAddress(invalidRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when addressIndex is negative', async () => {
    const invalidRequest = {
      method: RpcMethods.SignWithAddress,
      params: {
        network: 'testnet',
        message: 'test-message',
        addressIndex: -1,
      },
    } as SignWithAddressRpcRequest;

    await expect(
      signWithAddress(invalidRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should accept valid parameters', async () => {
    const validRequest = {
      method: RpcMethods.SignWithAddress,
      params: {
        network: 'testnet',
        message: 'test-message',
        addressIndex: 0,
      },
    } as SignWithAddressRpcRequest;

    mockTriggerHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SignMessageWithAddressConfirmationResponse,
        data: true,
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: true,
          pinCode: '1234',
        },
      });

    await expect(
      signWithAddress(validRequest, mockWallet, {}, mockTriggerHandler)
    ).resolves.toBeDefined();
  });
});
