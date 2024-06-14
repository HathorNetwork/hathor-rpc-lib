/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type RpcRequest = {
  method: 'get_address';
  id: string;
  jsonrpc: string;
} | {
  method: 'get_balance';
  id: string;
  jsonrpc: string;
  params: {
    token?: string | null;
  }
}
