/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export enum RpcMethods {
  SendTx = 'htr_sendTx',
  CreateToken = 'htr_createToken',
  GetUtxos = 'htr_getUtxos',
  SignWithAddress = 'htr_signWithAddress',
  GetBalance = 'htr_getBalance',
  GetConnectedNetwork = 'htr_getConnectedNetwork',
  GetAddress = 'htr_getAddress',
  PushTxHex = 'htr_pushTxHex',
  GetOperationStatus = 'htr_getOperationStatus',
  SendNanoContractTx = 'htr_sendNanoContractTx',
}

export interface BaseRpcRequest {
  method: string;
  id: string;
  jsonrpc: string;
}

export interface GetAddressRpcRequest extends BaseRpcRequest {
  method: RpcMethods.GetAddress,
  params: {
    type: 'first_empty' | 'full_path' | 'index' | 'client';
    index?: number;
    full_path?: string;
    network: string;
  }
}

export interface GetBalanceRpcRequest extends BaseRpcRequest {
  method: RpcMethods.GetBalance,
  params: {
    token?: string | null;
  };
}

export interface GetUtxosRpcRequest extends BaseRpcRequest {
  method: RpcMethods.GetUtxos,
  params: {
    maxUtxos: number;
    token: string;
    filterAddress: string;
    amountSmallerThan?: number | null;
    amountBiggerThan?: number | null;
    maximumAmount?: number | null;
    onlyAvailableUtxos: boolean;
  };
}

export interface SignWithAddressRpcRequest extends BaseRpcRequest {
  method: RpcMethods.SignWithAddress,
  params: {
    message: string;
    addressIndex: number;
  }
}

export interface SendTxOutput {
  address?: string | null;
  value?: number | null;
  token: string;
  type: string;
  data: string;
}

export interface SendTxInput {
  type: 'query' | 'specific';
  hash?: string | null;
  index?: number | null;
  max_utxos?: number | null;
  token?: string | null;
  filter_address?: string | null;
  amount_smaller_than?: number | null;
  amount_bigger_than?: number | null;
}

export interface SendTxRpcRequest extends BaseRpcRequest {
  method: RpcMethods.SendTx,
  params: {
    outputs: SendTxOutput[];
    inputs: SendTxInput[];
    changeAddress?: string;
    push_tx: boolean;
    network: string;
  }
}

export interface NCAction {
  type: string;
  token: string;
  amount: string;
}

export interface SendNanoContractRpcRequest extends BaseRpcRequest {
  method: RpcMethods.SendNanoContractTx,
  params: {
    method: string;
    blueprint_id: string;
    nc_id: string | null;
    actions: NCAction[];
    args: string[];
    push_tx: boolean;
  }
}

export interface GetConnectedNetworkRpcRequest extends BaseRpcRequest {
  method: RpcMethods.GetConnectedNetwork,
}

export interface GenericRpcRequest extends BaseRpcRequest {
  params?: unknown | null;
}

export type RpcRequest =
  GetAddressRpcRequest
  | GetBalanceRpcRequest
  | GetUtxosRpcRequest
  | SignWithAddressRpcRequest
  | GenericRpcRequest;
