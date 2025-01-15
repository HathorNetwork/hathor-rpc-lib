/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PromptRejectedError, InvalidParamsError } from '../../src/errors';
import { mockPromptHandler, mockGetUtxosRequest } from '../mocks';
import { HathorWallet } from '@hathor/wallet-lib';
import { getUtxos } from '../../src/rpcMethods/getUtxos';
import { TriggerTypes, TriggerResponseTypes, UtxoDetails, RpcMethods, GetUtxosRpcRequest } from '../../src/types';

const mockResponse: UtxoDetails = {
  total_amount_available: 50,
  total_utxos_available: 100,
  total_amount_locked: 0,
  total_utxos_locked: 0,
  utxos: [{
    address: 'address1',
    amount: 5,
    tx_id: 'txId1',
    locked: false,
    index: 0,
  }]
};

describe('getUtxos', () => {
  let wallet: jest.Mocked<HathorWallet>;

  beforeEach(() => {
    wallet = {
      getUtxos: jest.fn().mockResolvedValue(mockResponse),
      getNetwork: jest.fn().mockReturnValue('mainnet')
    } as unknown as HathorWallet;
  });

  describe('parameter validation', () => {
    it('should reject when method is missing', async () => {
      const invalidRequest = {
        params: mockGetUtxosRequest.params,
      } as GetUtxosRpcRequest;

      await expect(
        getUtxos(invalidRequest, wallet, {}, mockPromptHandler)
      ).rejects.toThrow(InvalidParamsError);
    });

    it('should reject when method is invalid', async () => {
      const invalidRequest = {
        method: 'invalid_method',
        params: mockGetUtxosRequest.params,
      } as unknown as GetUtxosRpcRequest;

      await expect(
        getUtxos(invalidRequest, wallet, {}, mockPromptHandler)
      ).rejects.toThrow(InvalidParamsError);
    });

    it('should reject when network is missing', async () => {
      const invalidRequest = {
        method: RpcMethods.GetUtxos,
        params: {
          ...mockGetUtxosRequest.params,
          network: undefined,
        },
      } as unknown as GetUtxosRpcRequest;

      await expect(
        getUtxos(invalidRequest, wallet, {}, mockPromptHandler)
      ).rejects.toThrow(InvalidParamsError);
    });

    it('should reject when filterAddress is missing', async () => {
      const invalidRequest = {
        method: RpcMethods.GetUtxos,
        params: {
          ...mockGetUtxosRequest.params,
          filterAddress: undefined,
        },
      } as unknown as GetUtxosRpcRequest;

      await expect(
        getUtxos(invalidRequest, wallet, {}, mockPromptHandler)
      ).rejects.toThrow(InvalidParamsError);
    });

    it('should use default values for optional parameters', async () => {
      mockPromptHandler.mockResolvedValue({
        type: TriggerResponseTypes.GetUtxosConfirmationResponse,
        data: true,
      });

      const request = {
        method: RpcMethods.GetUtxos,
        params: {
          network: 'mainnet',
          filterAddress: 'mock_address',
        },
      } as GetUtxosRpcRequest;

      await getUtxos(request, wallet, {}, mockPromptHandler);

      expect(wallet.getUtxos).toHaveBeenCalledWith(expect.objectContaining({
        token: 'HTR',
        max_utxos: 255,
        only_available_utxos: true,
      }));
    });
  });

  it('should return UTXO details if user confirms', async () => {
    mockPromptHandler.mockResolvedValue({
      type: TriggerResponseTypes.GetUtxosConfirmationResponse,
      data: true,
    });

    const result = await getUtxos(mockGetUtxosRequest, wallet, {}, mockPromptHandler);

    expect(wallet.getUtxos).toHaveBeenCalledWith({
      token: 'mock_token',
      authorities: 0,
      max_utxos: 10,
      filter_address: 'mock_address',
      amount_smaller_than: 1000,
      amount_bigger_than: 10,
      max_amount: 10000,
      only_available_utxos: true,
    });

    expect(mockPromptHandler).toHaveBeenCalledWith({
      type: TriggerTypes.GetUtxosConfirmationPrompt,
      method: mockGetUtxosRequest.method,
      data: mockResponse,
    }, {});

    expect(result.response).toEqual(mockResponse);
  });

  it('should throw PromptRejectedError if user rejects', async () => {
    mockPromptHandler.mockResolvedValue({
      type: TriggerResponseTypes.GetUtxosConfirmationResponse,
      data: false,
    });

    await expect(getUtxos(mockGetUtxosRequest, wallet, {}, mockPromptHandler)).rejects.toThrow(PromptRejectedError);
    expect(wallet.getUtxos).toHaveBeenCalledWith({
      token: 'mock_token',
      authorities: 0,
      max_utxos: 10,
      filter_address: 'mock_address',
      amount_smaller_than: 1000,
      amount_bigger_than: 10,
      max_amount: 10000,
      only_available_utxos: true,
    });

    expect(mockPromptHandler).toHaveBeenCalledWith({
      type: TriggerTypes.GetUtxosConfirmationPrompt,
      method: mockGetUtxosRequest.method,
      data: mockResponse,
    }, {});
  });
});
