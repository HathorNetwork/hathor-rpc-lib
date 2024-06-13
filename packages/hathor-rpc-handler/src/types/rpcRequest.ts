/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface RpcRequest {
  id: string;
  jsonrpc: string;
  method: string;
  params?: unknown;
}
