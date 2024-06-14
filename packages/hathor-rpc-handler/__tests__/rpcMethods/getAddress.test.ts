/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PromptRejectedError } from '../../src/errors';
import { getAddress } from '../../src/rpcMethods/getAddress';
import { HathorWallet } from '@hathor/wallet-lib';
import { mockGetAddressRequest } from '../mocks';


export const mockWallet = {
  getAddressAtIndex: jest.fn().mockReturnValue('mocked_address'),
} as unknown as HathorWallet;

export const mockPromptHandler = jest.fn();

describe('getAddress', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return address if user confirms', async () => {
    mockPromptHandler.mockResolvedValue(true);

    const result = await getAddress(mockGetAddressRequest, mockWallet, mockPromptHandler);

    expect(mockWallet.getAddressAtIndex).toHaveBeenCalledWith(0);
    expect(mockPromptHandler).toHaveBeenCalledWith({
      method: mockGetAddressRequest.method,
      data: {
        address: 'mocked_address',
      },
    });

    expect(result).toBe('mocked_address');
  });

  it('should throw PromptRejectedError if user rejects', async () => {
    mockPromptHandler.mockResolvedValue(false);

    await expect(getAddress(mockGetAddressRequest, mockWallet, mockPromptHandler)).rejects.toThrow(PromptRejectedError);

    expect(mockWallet.getAddressAtIndex).toHaveBeenCalledWith(0);
    expect(mockPromptHandler).toHaveBeenCalledWith({
      method: mockGetAddressRequest.method,
      data: {
        address: 'mocked_address',
      },
    });
  });
});
