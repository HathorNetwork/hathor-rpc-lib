import { constants } from '@hathor/wallet-lib';
import { GetAddressRpcRequest, GetBalanceRpcRequest, GetUtxosRpcRequest } from '../../src/types';

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

export const mockGetUtxosRequest: GetUtxosRpcRequest = {
  id: '1',
  jsonrpc: '2.0',
  method: 'htr_getUtxos',
  params: {
    token: 'mock_token',
    maxUtxos: 10,
    filterAddress: 'mock_address',
    amountSmallerThan: 1000,
    amountBiggerThan: 10,
    maximumAmount: 10000,
    onlyAvailableUtxos: true,
  },
};

export const mockPromptHandler = jest.fn();
