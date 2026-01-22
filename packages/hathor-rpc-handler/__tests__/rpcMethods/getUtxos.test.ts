/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PromptRejectedError, InvalidParamsError } from '../../src/errors';
import { mockPromptHandler, mockGetUtxosRequest } from '../mocks';
import type { IHathorWallet } from '@hathor/wallet-lib';
import { getUtxos } from '../../src/rpcMethods/getUtxos';
import { TriggerTypes, TriggerResponseTypes, UtxoDetails, RpcMethods, GetUtxosRpcRequest } from '../../src/types';

const mockResponse: UtxoDetails = {
  total_amount_available: 50n,
  total_utxos_available: 100n,
  total_amount_locked: 0n,
  total_utxos_locked: 0n,
  utxos: [{
    address: 'address1',
    amount: 5n,
    tx_id: 'txId1',
    locked: false,
    index: 0,
  }]
};

describe('getUtxos', () => {
  let wallet: jest.Mocked<IHathorWallet>;

  beforeEach(() => {
    wallet = {
      getUtxos: jest.fn().mockResolvedValue(mockResponse),
      getNetwork: jest.fn().mockReturnValue('mainnet')
    } as unknown as jest.Mocked<IHathorWallet>;
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
        amount_bigger_than: undefined,
        amount_smaller_than: undefined,
        authorities: undefined,
        max_amount: undefined,
        max_utxos: undefined,
        only_available_utxos: undefined,
        token: undefined
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
      authorities: undefined,
      max_utxos: 10,
      filter_address: 'mock_address',
      amount_smaller_than: 1000,
      amount_bigger_than: 10,
      max_amount: 10000,
      only_available_utxos: true,
    });

    expect(mockPromptHandler).toHaveBeenCalledWith({
      ...mockGetUtxosRequest,
      type: TriggerTypes.GetUtxosConfirmationPrompt,
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
      authorities: undefined,
      max_utxos: 10,
      filter_address: 'mock_address',
      amount_smaller_than: 1000,
      amount_bigger_than: 10,
      max_amount: 10000,
      only_available_utxos: true,
    });

    expect(mockPromptHandler).toHaveBeenCalledWith({
      ...mockGetUtxosRequest,
      type: TriggerTypes.GetUtxosConfirmationPrompt,
      data: mockResponse,
    }, {});
  });
});
