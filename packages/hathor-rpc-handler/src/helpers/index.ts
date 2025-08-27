/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { IHathorWallet } from '@hathor/wallet-lib';
import { config, nanoUtils, Network } from '@hathor/wallet-lib';
import { DifferentNetworkError, SendNanoContractTxError } from '../errors';

export function validateNetwork(wallet: IHathorWallet, network: string) {
  const currentNetwork = wallet.getNetwork();

  if (currentNetwork !== network) {
    throw new DifferentNetworkError();
  }
}

export async function parseNanoArgs(
  wallet: IHathorWallet,
  blueprintId: string | undefined | null,
  ncId: string | undefined | null,
  method: string,
  args: unknown[],
  network: string
) {
  if (!blueprintId && !ncId) {
    throw new SendNanoContractTxError(
      'Either blueprintId or ncId is required.'
    );
  }

  if (!blueprintId) {
    let response;
    try {
      response = await wallet.getFullTxById(ncId);
    } catch {
      // Error getting nano contract transaction data from the full node
      throw new SendNanoContractTxError(
        `Error getting nano contract transaction data with id ${ncId} from the full node`
      );
    }

    if (!response.tx.nc_id) {
      throw new SendNanoContractTxError(
        `Transaction with id ${ncId} is not a nano contract transaction.`
      );
    }

    blueprintId = response.tx.nc_blueprint_id;
  }

  config.setServerUrl(wallet.getServerUrl());
  const result = await nanoUtils.validateAndParseBlueprintMethodArgs(
    blueprintId!,
    method,
    args,
    new Network(network)
  );
  return result.map((data) => {
    return { ...data, parsed: data.field.toUser() };
  });
}
