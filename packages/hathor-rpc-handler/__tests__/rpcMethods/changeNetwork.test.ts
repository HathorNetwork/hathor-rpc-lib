/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IHathorWallet } from '@hathor/wallet-lib';
import { 
  TriggerResponseTypes, 
  RpcMethods,
  ChangeNetworkRpcRequest,
  TriggerTypes,
  RpcResponseTypes,
} from '../../src/types';
import { changeNetwork } from '../../src/rpcMethods/changeNetwork';
import { InvalidParamsError, PromptRejectedError } from '../../src/errors';

describe('changeNetwork', () => {
  const mockWallet = {
    getNetwork: jest.fn().mockReturnValue('testnet'),
  } as Partial<IHathorWallet> as IHathorWallet;

  const mockTriggerHandler = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parameter validation', () => {
    it('should reject when network is missing', async () => {
      const invalidRequest = {
        params: {
          newNetwork: 'mainnet',
        },
      } as ChangeNetworkRpcRequest;

      await expect(
        changeNetwork(invalidRequest, mockWallet, {}, mockTriggerHandler)
      ).rejects.toThrow(InvalidParamsError);
    });

    it('should reject when newNetwork is missing', async () => {
      const invalidRequest = {
        params: {
          network: 'testnet',
        },
      } as ChangeNetworkRpcRequest;

      await expect(
        changeNetwork(invalidRequest, mockWallet, {}, mockTriggerHandler)
      ).rejects.toThrow(InvalidParamsError);
    });
  });

  describe('functionality', () => {
    it('should accept valid parameters', async () => {
      const validRequest = {
        method: RpcMethods.ChangeNetwork,
        params: {
          network: 'testnet',
          newNetwork: 'mainnet',
        },
      } as ChangeNetworkRpcRequest;

      mockTriggerHandler
        .mockResolvedValueOnce({
          type: TriggerResponseTypes.ChangeNetworkRequestConfirmationResponse,
          data: true,
        });

      const result = await changeNetwork(validRequest, mockWallet, {}, mockTriggerHandler);

      expect(result).toBeDefined();
      expect(result.type).toBe(RpcResponseTypes.ChangeNetworkResponse);
      expect(result.response).toEqual({
        newNetwork: 'mainnet',
      });

      expect(mockTriggerHandler).toHaveBeenCalledWith({
        ...validRequest,
        type: TriggerTypes.ChangeNetworkConfirmationPrompt,
        data: {
          newNetwork: 'mainnet',
        },
      }, {});
    });

    it('should throw PromptRejectedError if user rejects confirmation', async () => {
      const validRequest = {
        method: RpcMethods.ChangeNetwork,
        params: {
          network: 'testnet',
          newNetwork: 'mainnet',
        },
      } as ChangeNetworkRpcRequest;

      mockTriggerHandler.mockResolvedValueOnce({
        type: TriggerResponseTypes.ChangeNetworkRequestConfirmationResponse,
        data: false,
      });

      await expect(
        changeNetwork(validRequest, mockWallet, {}, mockTriggerHandler)
      ).rejects.toThrow(PromptRejectedError);
    });
  });
});