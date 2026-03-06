/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NanoContractAction } from '@hathor/wallet-lib/lib/nano_contracts/types';
import {
  RpcMethods,
  SendNanoContractRpcRequest,
} from '../types';

export function sendNanoContractTxRpcRequest(
  network: string,
  method: string,
  blueprintId: string | null,
  actions: NanoContractAction[],
  args: unknown[],
  pushTx: boolean,
  ncId: string | null,
  maxFee?: string,
  contractPaysFees?: boolean,
): SendNanoContractRpcRequest {
  return {
    method: RpcMethods.SendNanoContractTx,
    params: {
      network,
      method,
      blueprint_id: blueprintId,
      actions,
      args,
      push_tx: pushTx,
      nc_id: ncId,
      ...(maxFee !== undefined && { max_fee: maxFee }),
      ...(contractPaysFees !== undefined && { contract_pays_fees: contractPaysFees }),
    }
  };
}
