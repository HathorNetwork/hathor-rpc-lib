import { PromptRejectedError } from '../../src/errors';
import { getAddress } from '../../src/rpcMethods/getAddress';
import { RpcRequest } from '../../src/types';
import { HathorWallet } from '@hathor/wallet-lib';

const mockRpcRequest: RpcRequest = {
  id: '1',
  jsonrpc: '2.0',
  method: 'get_address'
};

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

    const result = await getAddress(mockRpcRequest, mockWallet, mockPromptHandler);

    expect(mockWallet.getAddressAtIndex).toHaveBeenCalledWith(0);
    expect(mockPromptHandler).toHaveBeenCalledWith({
      method: 'get_address',
      data: {
        address: 'mocked_address',
      },
    });

    expect(result).toBe('mocked_address');
  });

  it('should throw PromptRejectedError if user rejects', async () => {
    mockPromptHandler.mockResolvedValue(false);

    await expect(getAddress(mockRpcRequest, mockWallet, mockPromptHandler)).rejects.toThrow(PromptRejectedError);

    expect(mockWallet.getAddressAtIndex).toHaveBeenCalledWith(0);
    expect(mockPromptHandler).toHaveBeenCalledWith({
      method: 'get_address',
      data: {
        address: 'mocked_address',
      },
    });
  });

  it('should throw Error if rpcRequest method is not get_address', async () => {
    const invalidRpcRequest = {
      ...mockRpcRequest,
      method: 'get_balance',
      params: {
        token: null
      },
    } as RpcRequest;

    await expect(getAddress(invalidRpcRequest, mockWallet, mockPromptHandler)).rejects.toThrow(Error);
    expect(mockWallet.getAddressAtIndex).not.toHaveBeenCalled();
    expect(mockPromptHandler).not.toHaveBeenCalled();
  });
});
