import { GetBalanceObject } from '@hathor/wallet-lib/lib/wallet/types';
import { PromptRejectedError } from '../../src/errors';
import { getBalance } from '../../src/rpcMethods/getBalance';
import { mockPromptHandler, mockGetBalanceRequest } from '../mocks';
import { HathorWallet, constants } from '@hathor/wallet-lib';

const mockedTokenBalance: GetBalanceObject[] = [{
  token: {
    id: 'moon-id',
    name: 'MOON TOKEN',
    symbol: 'MOON',
  },
  balance: {
    unlocked: 0,
    locked: 0,
  },
  tokenAuthorities: {
    unlocked: {
      mint: false,
      melt: false,
    },
    locked: {
      mint: false,
      melt: false,
    }
  },
  transactions: 0,
  lockExpires: null,
}];

const mockWallet = {
  getBalance: jest.fn().mockReturnValue(Promise.resolve(mockedTokenBalance)),
} as unknown as HathorWallet;

describe('getBalance', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return balance if user confirms', async () => {
    mockPromptHandler.mockResolvedValue(true);

    const result = await getBalance(mockGetBalanceRequest, mockWallet, mockPromptHandler);

    expect(mockWallet.getBalance).toHaveBeenCalledWith(constants.HATHOR_TOKEN_CONFIG.uid);
    expect(mockPromptHandler).toHaveBeenCalledWith({
      method: mockGetBalanceRequest.method,
      data: mockedTokenBalance,
    });
    expect(result).toEqual(mockedTokenBalance);
  });

  it('should throw PromptRejectedError if user rejects', async () => {
    mockPromptHandler.mockResolvedValue(false);

    await expect(getBalance(mockGetBalanceRequest, mockWallet, mockPromptHandler)).rejects.toThrow(PromptRejectedError);
    expect(mockWallet.getBalance).toHaveBeenCalledWith(constants.HATHOR_TOKEN_CONFIG.uid);
    expect(mockPromptHandler).toHaveBeenCalledWith({
      method: mockGetBalanceRequest.method,
      data: mockedTokenBalance,
    });
  });
});
