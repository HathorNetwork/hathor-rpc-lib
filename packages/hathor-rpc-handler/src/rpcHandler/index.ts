/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { HathorWallet } from "@hathor/wallet-lib";
import { InvalidRpcMethod } from "../errors";
import {
  createNanoContractCreateTokenTx,
  createToken,
  getAddress,
  getBalance,
  getConnectedNetwork,
  getUtxos,
  sendNanoContractTx,
  sendTransaction,
  signOracleData,
  signWithAddress,
} from "../rpcMethods";
import {
  RequestMetadata,
  RpcMethods,
  RpcRequest,
  RpcResponse,
  TriggerHandler,
} from "../types";

export const handleRpcRequest = async (
  request: RpcRequest,
  wallet: HathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler
): Promise<RpcResponse> => {
  const methodMap = {
    [RpcMethods.SignWithAddress]: signWithAddress,
    [RpcMethods.GetAddress]: getAddress,
    [RpcMethods.GetConnectedNetwork]: getConnectedNetwork,
    [RpcMethods.GetUtxos]: getUtxos,
    [RpcMethods.GetBalance]: getBalance,
    [RpcMethods.CreateToken]: createToken,
    [RpcMethods.SignOracleData]: signOracleData,
    [RpcMethods.SendNanoContractTx]: sendNanoContractTx,
    [RpcMethods.SendTransaction]: sendTransaction,
    [RpcMethods.CreateNanoContractCreateTokenTx]:
      createNanoContractCreateTokenTx,
  };
  const method = methodMap[request.method as keyof typeof methodMap] as
    | typeof handleRpcRequest
    | undefined;
  if (!method) {
    throw new InvalidRpcMethod();
  }

  return method(request, wallet, requestMetadata, promptHandler);
};
