/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface BaseRpcRequest {
  method: string;
  id: string;
  jsonrpc: string;
}

export interface GetAddressRpcRequest extends BaseRpcRequest {
  method: 'htr_getAddress';
}

export interface GetBalanceRpcRequest extends BaseRpcRequest {
  method: 'htr_getBalance';
  params: {
    token?: string | null;
  };
}

export interface GetUtxosRpcRequest extends BaseRpcRequest {
  method: 'htr_getUtxos';
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

export interface GenericRpcRequest extends BaseRpcRequest {
  params?: unknown | null;
}

export type RpcRequest =
  GetAddressRpcRequest
  | GetBalanceRpcRequest
  | GetUtxosRpcRequest 
  | GenericRpcRequest;
