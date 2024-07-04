/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NanoContractAction } from "@hathor/wallet-lib/lib/nano_contracts/types";

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
    network: string;
    tokens: string[];
    addressIndexes?: number[];
  };
}

export interface GetUtxosRpcRequest extends BaseRpcRequest {
  method: RpcMethods.GetUtxos,
  params: {
    network: string;
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
    network: string;
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

export interface QueryUtxosFilters {
  max_utxos?: number | null;
  token?: string | null;
  filter_address?: string | null;
  amount_smaller_than?: number | null;
  amount_bigger_than?: number | null;
  authorities?: number | null;
}

export interface SendTxInputQuery extends QueryUtxosFilters {
  type: 'query';
}

export interface SendTxInputSpecific {
  type: 'specific';
  hash: string;
  index: number;
}

export type SendTxInput = 
  SendTxInputQuery
  | SendTxInputSpecific;

export interface SendTxRpcRequest extends BaseRpcRequest {
  method: RpcMethods.SendTx,
  params: {
    token?: string;
    outputs: SendTxOutput[];
    inputs: SendTxInput[];
    changeAddress?: string | null;
    push_tx: boolean;
    network: string;
  }
}

export interface SendNanoContractRpcRequest extends BaseRpcRequest {
  method: RpcMethods.SendNanoContractTx,
  params: {
    method: string;
    blueprint_id: string;
    nc_id: string | null;
    actions: NanoContractAction[],
    args: unknown[];
    push_tx: boolean;
  }
}

export type RequestMetadata = {
  [key: string]: string,
};

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
