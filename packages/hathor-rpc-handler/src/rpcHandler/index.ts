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
  PromptHandler,
  RpcMethods,
  RpcRequest,
  SignWithAddressRpcRequest,
} from '../types';
import { signWithAddress } from '../rpcMethods/signWithAddress';
import { HathorWallet } from '@hathor/wallet-lib';
import { getAddress, getBalance, getUtxos } from '../rpcMethods';
import { getConnectedNetwork } from '../rpcMethods/getConnectedNetwork';

export const handleRpcRequest = async (
  request: RpcRequest,
  wallet: HathorWallet,
  promptHandler: PromptHandler,
) => {
  switch (request.method) {
    case RpcMethods.SignWithAddress: return signWithAddress(
      request as SignWithAddressRpcRequest,
      wallet,
      promptHandler,
    );
    case RpcMethods.GetAddress: return getAddress(
      request as GetAddressRpcRequest,
      wallet,
      promptHandler,
    );
    case RpcMethods.GetConnectedNetwork: return getConnectedNetwork(
      request as GetConnectedNetworkRpcRequest,
      wallet,
    );
    case RpcMethods.GetUtxos: return getUtxos(
      request as GetUtxosRpcRequest,
      wallet,
      promptHandler,
    );
    case RpcMethods.GetBalance: return getBalance(
      request as GetBalanceRpcRequest,
      wallet,
      promptHandler,
    )
  }
};
