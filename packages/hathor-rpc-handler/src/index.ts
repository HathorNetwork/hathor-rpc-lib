/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RpcRequest, RpcResponse } from './types';
import { sendTx } from './rpcMethods/sendTx';
import { getUtxos } from './rpcMethods/getUtxos';
import { signWithAddress } from './rpcMethods/signWithAddress';
import { getBalance } from './rpcMethods/getBalance';
import { getConnectedNetwork } from './rpcMethods/getConnectedNetwork';
import { getAddress } from './rpcMethods/getAddress';
import { HathorWallet } from '@hathor/wallet-lib';

export const handleRpcRequest = async (request: RpcRequest, wallet: HathorWallet): Promise<RpcResponse | void> => {
  switch (request.method) {
    case 'htr_sendTx':
      return sendTx(request, wallet);
    case 'htr_getUtxos':
      return getUtxos(request, wallet);
    case 'htr_signWithAddress':
      return signWithAddress(request, wallet);
    case 'htr_getBalance':
      return getBalance(request, wallet);
    case 'htr_getConnectedNetwork':
      return getConnectedNetwork(request, wallet);
    case 'htr_getAddress':
      return getAddress(request, wallet);
    default:
      return {
        id: request.id,
        jsonrpc: request.jsonrpc,
        error: { code: -32601, message: 'Method not found' },
      };
  }
};
