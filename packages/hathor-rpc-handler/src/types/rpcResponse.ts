/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SendTransaction } from '@hathor/wallet-lib';
import NanoContract from '@hathor/wallet-lib/lib/nano_contracts/nano_contract';
import { AddressInfoObject } from '@hathor/wallet-lib/lib/wallet/types';

export enum RpcResponseTypes {
  SendNanoContractTxResponse,
  SendWithAddressResponse
}

export interface BaseRpcResponse {
  type: RpcResponseTypes;
}

export interface SendNanoContractTxResponse extends BaseRpcResponse {
  type: RpcResponseTypes.SendNanoContractTxResponse;
  response: SendTransaction | NanoContract;
}

export interface SignWithAddressResponse extends BaseRpcResponse {
  type: RpcResponseTypes.SendWithAddressResponse;
  response: {
    message: string;
    signature: string;
    address: AddressInfoObject;
  }
}

export type RpcResponse =
  SendNanoContractTxResponse;
