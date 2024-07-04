/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  GetAddressRpcRequest,
  GetBalanceRpcRequest,
  GetConnectedNetworkRpcRequest,
  GetUtxosRpcRequest,
  TriggerHandler,
  RequestMetadata,
  RpcMethods,
  RpcRequest,
  SendNanoContractRpcRequest,
  SendTxRpcRequest,
  SignWithAddressRpcRequest,
} from '../types';
import { signWithAddress } from '../rpcMethods/signWithAddress';
import { HathorWallet } from '@hathor/wallet-lib';
import { getAddress, getBalance, getUtxos, sendNanoContractTx } from '../rpcMethods';
import { getConnectedNetwork } from '../rpcMethods/getConnectedNetwork';
import { sendTx } from '../rpcMethods/sendTx';
import { InvalidRpcMethod } from '../errors';

export const handleRpcRequest = async (
  request: RpcRequest,
  wallet: HathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
) => {
  switch (request.method) {
    case RpcMethods.SignWithAddress: return signWithAddress(
      request as SignWithAddressRpcRequest,
      wallet,
      requestMetadata,
      promptHandler,
    );
    case RpcMethods.GetAddress: return getAddress(
      request as GetAddressRpcRequest,
      wallet,
      requestMetadata,
      promptHandler,
    );
    case RpcMethods.GetConnectedNetwork: return getConnectedNetwork(
      request as GetConnectedNetworkRpcRequest,
      wallet,
    );
    case RpcMethods.GetUtxos: return getUtxos(
      request as GetUtxosRpcRequest,
      wallet,
      requestMetadata,
      promptHandler,
    );
    case RpcMethods.GetBalance: return getBalance(
      request as GetBalanceRpcRequest,
      wallet,
      requestMetadata,
      promptHandler,
    );
    case RpcMethods.SendTx: return sendTx(
      request as SendTxRpcRequest,
      wallet,
      requestMetadata,
      promptHandler,
    );
    case RpcMethods.SendNanoContractTx: return sendNanoContractTx(
      request as SendNanoContractRpcRequest,
      wallet,
      requestMetadata,
      promptHandler,
    );
    default: throw new InvalidRpcMethod();
  }
};
