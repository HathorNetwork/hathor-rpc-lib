/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SendTransaction } from '@hathor/wallet-lib';
import NanoContract from '@hathor/wallet-lib/lib/nano_contracts/nano_contract';

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

export type RpcResponse =
  SendNanoContractTxResponse;
