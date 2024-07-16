/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from '@hathor/wallet-lib';
import {
  TriggerHandler,
  RequestMetadata,
  ExecuteMultipleRpcRequest,
} from '../types';
import { handleRpcRequest } from '../rpcHandler';

export async function executeMultiple(
  rpcRequest: ExecuteMultipleRpcRequest,
  wallet: HathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
) {
  const { requests } = rpcRequest.params;
  const context = {};

  for (const request of requests) {
    const response = await handleRpcRequest(
      request,
      wallet,
      requestMetadata,
      promptHandler,
    );

    context[request.method] = response;
  }
}
