/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PromptRejectedError } from '../../src/errors';
import { mockPromptHandler, mockGetUtxosRequest } from '../mocks';
import { HathorWallet, HathorWalletServiceWallet } from '@hathor/wallet-lib';
import { getUtxos } from '../../src/rpcMethods/getUtxos';
import { UtxoDetails } from '../../src/types';

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

const mockWallet = {
  getUtxos: jest.fn().mockResolvedValue(mockResponse),
} as unknown as HathorWallet;

describe('getUtxos', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return UTXO details if user confirms', async () => {
    mockPromptHandler.mockResolvedValue(true);

    const result = await getUtxos(mockGetUtxosRequest, mockWallet, mockPromptHandler);

    expect(mockWallet.getUtxos).toHaveBeenCalledWith({
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
      method: mockGetUtxosRequest.method,
      data: mockResponse,
    });

    expect(result).toEqual(mockResponse);
  });

  it('should throw PromptRejectedError if user rejects', async () => {
    mockPromptHandler.mockResolvedValue(false);

    await expect(getUtxos(mockGetUtxosRequest, mockWallet, mockPromptHandler)).rejects.toThrow(PromptRejectedError);
    expect(mockWallet.getUtxos).toHaveBeenCalledWith({
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
      method: mockGetUtxosRequest.method,
      data: mockResponse,
    });
  });

  it('should throw Error if the method is not implemented in the wallet-service facade', async () => {
    const instance = Object.create(HathorWalletServiceWallet.prototype);
    const walletServiceMock = Object.assign(instance, {
      ...mockWallet,
    });

    await expect(getUtxos(mockGetUtxosRequest, walletServiceMock, mockPromptHandler)).rejects.toThrow(Error);
    expect(walletServiceMock.getUtxos).not.toHaveBeenCalled();
    expect(mockPromptHandler).not.toHaveBeenCalled();
  });
});
