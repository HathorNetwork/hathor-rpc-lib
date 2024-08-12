/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SendTransaction, Transaction } from '@hathor/wallet-lib';
import NanoContract from '@hathor/wallet-lib/lib/nano_contracts/nano_contract';
import { AddressInfoObject, GetBalanceObject } from '@hathor/wallet-lib/lib/wallet/types';
import { UtxoDetails } from './prompt';

export enum RpcResponseTypes {
  SendNanoContractTxResponse,
  SendWithAddressResponse,
  GetAddressResponse,
  GetBalanceResponse,
  GetConnectedNetworkResponse,
  GetUtxosResponse,
  CreateTokenResponse,
}

export interface BaseRpcResponse {
  type: RpcResponseTypes;
}

export interface GetAddressResponse extends BaseRpcResponse {
  type: RpcResponseTypes.GetAddressResponse;
  response: AddressInfoObject,
}

export interface SendNanoContractTxResponse extends BaseRpcResponse {
  type: RpcResponseTypes.SendNanoContractTxResponse;
  response: SendTransaction | NanoContract;
}

export interface CreateTokenResponse extends BaseRpcResponse {
  type: RpcResponseTypes.CreateTokenResponse;
  response: Transaction,
}

export interface SignWithAddressResponse extends BaseRpcResponse {
  type: RpcResponseTypes.SendWithAddressResponse;
  response: {
    message: string;
    signature: string;
    address: AddressInfoObject;
  }
}

export interface GetBalanceResponse extends BaseRpcResponse {
  type: RpcResponseTypes.GetBalanceResponse;
  response: GetBalanceObject[];
}

export interface GetConnectedNetworkResponse extends BaseRpcResponse {
  type: RpcResponseTypes.GetConnectedNetworkResponse;
  response: {
    network: string;
    genesisHash: string;
  }
}

export interface GetUtxosResponse extends BaseRpcResponse {
  type: RpcResponseTypes.GetUtxosResponse;
  response: UtxoDetails[];
}

export type RpcResponse = GetAddressResponse
  | SendNanoContractTxResponse
  | SignWithAddressResponse
  | GetBalanceResponse
  | GetConnectedNetworkResponse
  | CreateTokenResponse
  | GetUtxosResponse;
