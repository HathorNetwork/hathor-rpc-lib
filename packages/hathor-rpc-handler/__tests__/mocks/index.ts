import { constants } from '@hathor/wallet-lib';
import { GetAddressRpcRequest, GetBalanceRpcRequest } from '../../src/types';

export const mockGetBalanceRequest: GetBalanceRpcRequest = {
  id: '1',
  jsonrpc: '2.0',
  method: 'htr_getBalance',
  params: {
    token: constants.HATHOR_TOKEN_CONFIG.uid,
  },
};

export const mockGetAddressRequest: GetAddressRpcRequest = {
  id: '1',
  jsonrpc: '2.0',
  method: 'htr_getAddress',
};

export const mockPromptHandler = jest.fn();
