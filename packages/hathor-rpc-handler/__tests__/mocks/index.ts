import { constants } from '@hathor/wallet-lib';
import { GetAddressRpcRequest, GetBalanceRpcRequest, GetConnectedNetworkRpcRequest, GetUtxosRpcRequest, RpcMethods, SignWithAddressRpcRequest } from '../../src/types';

export const mockGetBalanceRequest: GetBalanceRpcRequest = {
  id: '1',
  jsonrpc: '2.0',
  method: RpcMethods.GetBalance,
  params: {
    token: constants.HATHOR_TOKEN_CONFIG.uid,
  },
};

export const mockGetAddressRequest: GetAddressRpcRequest = {
  id: '1',
  jsonrpc: '2.0',
  method: RpcMethods.GetAddress,
  params: {
    network: 'mainnet',
    type: 'index',
    index: 1,
  }
};

export const mockGetUtxosRequest: GetUtxosRpcRequest = {
  id: '1',
  jsonrpc: '2.0',
  method: RpcMethods.GetUtxos,
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

export const mockSignWithAddressRequest: SignWithAddressRpcRequest = {
  id: '1',
  jsonrpc: '2.0',
  method: RpcMethods.SignWithAddress,
  params: {
    addressIndex: 0,
    message: 'Test message',
  },
};

export const mockGetConnectedNetworkRequest: GetConnectedNetworkRpcRequest = {
  id: '1',
  jsonrpc: '2.0',
  method: RpcMethods.GetConnectedNetwork,
};

export const mockPromptHandler = jest.fn();
