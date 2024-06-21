/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NotImplementedError, PromptRejectedError } from '../../src/errors';
import { getAddress } from '../../src/rpcMethods/getAddress';
import { HathorWallet, Network } from '@hathor/wallet-lib';
import { ConfirmationPromptTypes, GetAddressRpcRequest, RpcMethods } from '../../src/types';

export const mockPromptHandler = jest.fn();

describe('getAddress', () => {
  let promptHandler: jest.Mock;
  let mockWallet: jest.Mocked<HathorWallet>;

  beforeEach(() => {
    promptHandler = jest.fn();
    mockWallet = {
      getAddressAtIndex: jest.fn().mockReturnValue('mocked_address'),
      getCurrentAddress: jest.fn().mockReturnValue({
        address: 'address1',
        index: 0,
        addressPath: `m/44'/280'/0'/0/10`,
      }),
      getNetworkObject: jest.fn().mockReturnValue(new Network('mainnet'))
    } as unknown as HathorWallet;
  });

  it('should return the current address for type "first_empty"', async () => {
    const rpcRequest: GetAddressRpcRequest = {
      id: '3',
      jsonrpc: '2.0',
      params: { type: 'first_empty', network: 'mainnet' },
      method: RpcMethods.GetAddress,
    };
    mockWallet.getCurrentAddress.mockResolvedValue('current-address');
    promptHandler.mockReturnValueOnce(true);

    const address = await getAddress(rpcRequest, mockWallet, promptHandler);

    expect(address).toBe('current-address');
    expect(mockWallet.getCurrentAddress).toHaveBeenCalled();
  });

  it('should throw NotImplementedError for type "full_path"', async () => {
    const rpcRequest: GetAddressRpcRequest = {
      id: '3',
      jsonrpc: '2.0',
      params: { type: 'full_path', network: 'mainnet' },
      method: RpcMethods.GetAddress,
    };

    await expect(getAddress(rpcRequest, mockWallet, promptHandler)).rejects.toThrow(NotImplementedError);
  });

  it('should return the address at index for type "index"', async () => {
    const rpcRequest: GetAddressRpcRequest = {
      id: '3',
      jsonrpc: '2.0',
      params: { type: 'index', index: 5, network: 'mainnet' },
      method: RpcMethods.GetAddress,
    };
    mockWallet.getAddressAtIndex.mockResolvedValue('address-at-index');
    promptHandler.mockReturnValueOnce(true);

    const address = await getAddress(rpcRequest, mockWallet, promptHandler);

    expect(address).toBe('address-at-index');
    expect(mockWallet.getAddressAtIndex).toHaveBeenCalledWith(5);
  });

  it('should return the client address for type "client"', async () => {
    const rpcRequest: GetAddressRpcRequest = {
      id: '3',
      jsonrpc: '2.0',
      params: { type: 'client', network: 'mainnet' },
      method: RpcMethods.GetAddress,
    };
    const clientPromptResponse = { data: { address: 'client-address' } };
    promptHandler.mockResolvedValue(clientPromptResponse);

    const address = await getAddress(rpcRequest, mockWallet, promptHandler);

    expect(address).toBe('client-address');
    expect(promptHandler).toHaveBeenCalledWith({
      type: ConfirmationPromptTypes.AddressRequestClientPrompt,
      method: RpcMethods.GetAddress,
    });
  });

  it('should throw PromptRejectedError if address confirmation is rejected', async () => {
    const rpcRequest: GetAddressRpcRequest = {
      id: '3',
      jsonrpc: '2.0',
      params: { type: 'first_empty', network: 'mainnet' },
      method: RpcMethods.GetAddress,
    };
    mockWallet.getCurrentAddress.mockResolvedValue('current-address');
    promptHandler.mockResolvedValueOnce(false);

    await expect(getAddress(rpcRequest, mockWallet, promptHandler)).rejects.toThrow(PromptRejectedError);
  });

  it('should confirm the address if type is not "client"', async () => {
    const rpcRequest: GetAddressRpcRequest = {
      id: '3',
      jsonrpc: '2.0',
      params: { type: 'first_empty', network: 'mainnet' },
      method: RpcMethods.GetAddress,
    };
    mockWallet.getCurrentAddress.mockResolvedValue('current-address');
    promptHandler.mockResolvedValue(true);

    const address = await getAddress(rpcRequest, mockWallet, promptHandler);

    expect(address).toBe('current-address');
    expect(promptHandler).toHaveBeenCalledWith({
      type: ConfirmationPromptTypes.AddressRequestPrompt,
      method: RpcMethods.GetAddress,
      data: { address: 'current-address' },
    });
  });
});
