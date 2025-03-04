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
  TriggerTypes,
  RpcResponseTypes,
} from '../../src/types';
import { signWithAddress } from '../../src/rpcMethods/signWithAddress';
import { InvalidParamsError, PromptRejectedError } from '../../src/errors';

describe('signWithAddress', () => {
  const mockWallet = {
    getNetwork: jest.fn().mockReturnValue('testnet'),
    getAddressAtIndex: jest.fn().mockResolvedValue('test-address'),
    getAddressPathForIndex: jest.fn().mockResolvedValue('test-path'),
    signMessageWithAddress: jest.fn().mockResolvedValue('test-signature'),
  } as unknown as HathorWallet;

  const mockTriggerHandler = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parameter validation', () => {
    it('should reject when method is missing', async () => {
      const invalidRequest = {
        params: {
          network: 'testnet',
          message: 'test-message',
          addressIndex: 0,
        },
      } as SignWithAddressRpcRequest;

      await expect(
        signWithAddress(invalidRequest, mockWallet, {}, mockTriggerHandler)
      ).rejects.toThrow(InvalidParamsError);
    });

    it('should reject when method is invalid', async () => {
      const invalidRequest = {
        method: 'invalid_method',
        params: {
          network: 'testnet',
          message: 'test-message',
          addressIndex: 0,
        },
      } as unknown as SignWithAddressRpcRequest;

      await expect(
        signWithAddress(invalidRequest, mockWallet, {}, mockTriggerHandler)
      ).rejects.toThrow(InvalidParamsError);
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

    it('should reject when addressIndex is not an integer', async () => {
      const invalidRequest = {
        method: RpcMethods.SignWithAddress,
        params: {
          network: 'testnet',
          message: 'test-message',
          addressIndex: 1.5,
        },
      } as SignWithAddressRpcRequest;

      await expect(
        signWithAddress(invalidRequest, mockWallet, {}, mockTriggerHandler)
      ).rejects.toThrow(InvalidParamsError);
    });
  });

  describe('functionality', () => {
    it('should accept valid parameters and sign message', async () => {
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

      const result = await signWithAddress(validRequest, mockWallet, {}, mockTriggerHandler);

      expect(result).toBeDefined();
      expect(result.type).toBe(RpcResponseTypes.SendWithAddressResponse);
      expect(result.response).toEqual({
        message: 'test-message',
        signature: 'test-signature',
        address: {
          address: 'test-address',
          index: 0,
          addressPath: 'test-path',
          info: undefined,
        },
      });

      expect(mockTriggerHandler).toHaveBeenCalledWith({
        type: TriggerTypes.SignMessageWithAddressConfirmationPrompt,
        method: validRequest.method,
        data: {
          address: {
            address: 'test-address',
            index: 0,
            addressPath: 'test-path',
            info: undefined,
          },
          message: 'test-message',
        },
      }, {});
    });

    it('should throw PromptRejectedError if user rejects sign confirmation', async () => {
      const validRequest = {
        method: RpcMethods.SignWithAddress,
        params: {
          network: 'testnet',
          message: 'test-message',
          addressIndex: 0,
        },
      } as SignWithAddressRpcRequest;

      mockTriggerHandler.mockResolvedValueOnce({
        type: TriggerResponseTypes.SignMessageWithAddressConfirmationResponse,
        data: false,
      });

      await expect(
        signWithAddress(validRequest, mockWallet, {}, mockTriggerHandler)
      ).rejects.toThrow(PromptRejectedError);
    });

    it('should throw PromptRejectedError if user rejects PIN prompt', async () => {
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
            accepted: false,
          },
        });

      await expect(
        signWithAddress(validRequest, mockWallet, {}, mockTriggerHandler)
      ).rejects.toThrow(PromptRejectedError);
    });
  });
});
