/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CreateTokenTransaction, Transaction } from '@hathor/wallet-lib';
import { AddressInfoObject, GetBalanceObject } from '@hathor/wallet-lib/lib/wallet/types';
import { UtxoDetails } from './prompt';
import { IUserSignedData } from '@hathor/wallet-lib/lib/nano_contracts/fields/signedData';

export enum RpcResponseTypes {
  SendNanoContractTxResponse,
  SendWithAddressResponse,
  GetAddressResponse,
  GetBalanceResponse,
  GetConnectedNetworkResponse,
  GetUtxosResponse,
  CreateTokenResponse,
  SignOracleDataResponse,
  SendTransactionResponse,
  CreateNanoContractCreateTokenTxResponse,
  ChangeNetworkResponse,
  GetXpubResponse,
  GetWalletInformationResponse,
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
  response: Transaction | string;
}

export interface CreateTokenResponse extends BaseRpcResponse {
  type: RpcResponseTypes.CreateTokenResponse;
  response: CreateTokenTransaction,
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

export interface SignOracleDataResponse extends BaseRpcResponse {
  type: RpcResponseTypes.SignOracleDataResponse;
  response: {
    data: string;
    signedData: IUserSignedData,
    oracle: string;
  }
}

export interface GetUtxosResponse extends BaseRpcResponse {
  type: RpcResponseTypes.GetUtxosResponse;
  response: UtxoDetails;
}

export interface SendTransactionResponse extends BaseRpcResponse {
  type: RpcResponseTypes.SendTransactionResponse;
  response: Transaction;
}

export interface CreateNanoContractCreateTokenTxResponse extends BaseRpcResponse {
  type: RpcResponseTypes.CreateNanoContractCreateTokenTxResponse;
  response: Transaction;
}

export interface ChangeNetworkResponse extends BaseRpcResponse {
  type: RpcResponseTypes.ChangeNetworkResponse;
  response: {
    newNetwork: string;
  }
}

export interface GetXpubResponse extends BaseRpcResponse {
  type: RpcResponseTypes.GetXpubResponse;
  response: {
    xpub: string;
  };
}

export interface GetWalletInformationResponse extends BaseRpcResponse {
  type: RpcResponseTypes.GetWalletInformationResponse;
  response: {
    network: string;
    address0: string;
  }
}

export type RpcResponse = GetAddressResponse
  | SendNanoContractTxResponse
  | SignWithAddressResponse
  | GetBalanceResponse
  | GetConnectedNetworkResponse
  | CreateTokenResponse
  | SignOracleDataResponse
  | GetUtxosResponse
  | SendTransactionResponse
  | CreateNanoContractCreateTokenTxResponse
  | ChangeNetworkResponse
  | GetXpubResponse
  | GetWalletInformationResponse;
