/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IHathorWallet } from '@hathor/wallet-lib';
import { 
  RpcMethods,
  GetConnectedNetworkRpcRequest,
  RpcResponseTypes,
} from '../../src/types';
import { getConnectedNetwork } from '../../src/rpcMethods/getConnectedNetwork';
import { InvalidParamsError } from '../../src/errors';

describe('getConnectedNetwork parameter validation', () => {
  const mockWallet: Partial<IHathorWallet> = {
    getNetwork: jest.fn().mockReturnValue('testnet'),
  };

  const mockTriggerHandler = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject when method is missing', async () => {
    const invalidRequest = {
      // method is missing
    } as GetConnectedNetworkRpcRequest;

    await expect(
      getConnectedNetwork(invalidRequest, mockWallet as IHathorWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when method is invalid', async () => {
    const invalidRequest = {
      method: 'invalid_method',
    } as unknown as GetConnectedNetworkRpcRequest;

    await expect(
      getConnectedNetwork(invalidRequest, mockWallet as IHathorWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should accept valid request', async () => {
    const validRequest = {
      method: RpcMethods.GetConnectedNetwork,
    } as GetConnectedNetworkRpcRequest;

    const result = await getConnectedNetwork(validRequest, mockWallet as IHathorWallet, {}, mockTriggerHandler);

    expect(result).toBeDefined();
    expect(result.type).toBe(RpcResponseTypes.GetConnectedNetworkResponse);
    expect(result.response).toEqual({
      network: 'testnet',
      genesisHash: '',
    });
    expect(mockWallet.getNetwork).toHaveBeenCalled();
  });
});
