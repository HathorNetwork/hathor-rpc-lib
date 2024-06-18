/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PromptRejectedError } from '../../src/errors';
import { signWithAddress } from '../../src/rpcMethods/signWithAddress';
import { ConfirmationPromptTypes } from '../../src/types';
import { mockPromptHandler, mockSignWithAddressRequest } from '../mocks';
import { IHathorWallet } from '@hathor/wallet-lib/lib/wallet/types';

export const mockWallet = {
  getAddressAtIndex: jest.fn().mockReturnValue('mocked_address'),
  signMessageWithAddress: jest.fn().mockResolvedValue('signed_message'),
} as unknown as IHathorWallet;

describe('signWithAddress', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return signed message if user confirms and provides PIN', async () => {
    mockPromptHandler
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce('mock_pin');

    const result = await signWithAddress(mockSignWithAddressRequest, mockWallet, mockPromptHandler);

    expect(mockWallet.getAddressAtIndex).toHaveBeenCalledWith(0);
    expect(mockPromptHandler).toHaveBeenCalledWith({
      type: ConfirmationPromptTypes.SignMessageWithAddress,
      method: mockSignWithAddressRequest.method,
      data: {
        address: 'mocked_address',
        message: 'Test message',
      },
    });
    expect(mockPromptHandler).toHaveBeenCalledWith({
      method: mockSignWithAddressRequest.method,
    });
    expect(mockWallet.signMessageWithAddress).toHaveBeenCalledWith('Test message', 0, 'mock_pin');
    expect(result).toBe('signed_message');
  });

  it('should throw PromptRejectedError if user rejects address confirmation', async () => {
    mockPromptHandler.mockResolvedValueOnce(false);

    await expect(signWithAddress(mockSignWithAddressRequest, mockWallet, mockPromptHandler)).rejects.toThrow(PromptRejectedError);
    expect(mockWallet.getAddressAtIndex).toHaveBeenCalledWith(0);
    expect(mockPromptHandler).toHaveBeenCalledWith({
      type: ConfirmationPromptTypes.SignMessageWithAddress,
      method: mockSignWithAddressRequest.method,
      data: {
        address: 'mocked_address',
        message: 'Test message',
      },
    });
    expect(mockPromptHandler).not.toHaveBeenCalledWith({
      method: mockSignWithAddressRequest.method,
    });
    expect(mockWallet.signMessageWithAddress).not.toHaveBeenCalled();
  });

  it('should throw PromptRejectedError if user rejects PIN prompt', async () => {
    mockPromptHandler
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(Promise.reject()); 

    await expect(signWithAddress(mockSignWithAddressRequest, mockWallet, mockPromptHandler)).rejects.toThrow(PromptRejectedError);
    expect(mockWallet.getAddressAtIndex).toHaveBeenCalledWith(0);
    expect(mockPromptHandler).toHaveBeenCalledWith({
      type: ConfirmationPromptTypes.SignMessageWithAddress,
      method: mockSignWithAddressRequest.method,
      data: {
        address: 'mocked_address',
        message: 'Test message',
      },
    });
    expect(mockPromptHandler).toHaveBeenCalledWith({
      method: mockSignWithAddressRequest.method,
    });
    expect(mockWallet.signMessageWithAddress).not.toHaveBeenCalled();
  });
});
