/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from '@hathor/wallet-lib';
import { NATIVE_TOKEN_UID } from '@hathor/wallet-lib/lib/constants';
import { QueryUtxosFilters, SendTxInput, SendTxInputSpecific, SendTxOutput, UtxoDetails, UtxoInfo } from '../types';
import { NoUtxosAvailableError } from '../errors';

export interface TokenOutput {
  tokenUid: string;
  amount: number;
}

export interface PreparedInput {
  txId: string;
  index: number;
}

export interface PreparedTxResponse {
  success: boolean;
  outputs: SendTxOutput[];
  inputs: PreparedInput[];
}

export async function getUtxosToFillTx(
  wallet: HathorWallet,
  sumOutputs: number,
  options: QueryUtxosFilters,
): Promise<UtxoInfo[] | null> {
  // We want to find only utxos to use in the tx, so we must filter by available only
  const getUtxosOptions = {
    ...options,
    only_available_utxos: true
  };
  const utxosDetails: UtxoDetails = await wallet.getUtxos(getUtxosOptions);

  // If we can't fill all the amount with the returned utxos, then return null
  if (utxosDetails.total_amount_available < sumOutputs) {
    return null;
  }

  const utxos: UtxoInfo[] = utxosDetails.utxos;

  // Sort utxos with larger amounts first
  utxos.sort((a, b) => b.amount - a.amount);

  if (utxos[0].amount > sumOutputs) {
    // If we have a single utxo capable of providing the full amount
    // then we find the smallest utxos that can fill the full amount

    // This is the index of the first utxo that does not fill the full amount
    // if this is -1, then all utxos fill the full amount and we should get the last one
    const firstSmallerIndex = utxos.findIndex(obj => obj.amount < sumOutputs);

    if (firstSmallerIndex === -1) {
      // Return the last element of the array (the one with smaller amount)
      return [
        utxos[utxos.length -1],
      ];
    }

    // Return the element right before the first element that does not provide the full amount
    return [utxos[firstSmallerIndex - 1]];
  }

  // Else we get the utxos in order until the full amount is filled
  let total = 0;
  const retUtxos = [];

  for (const utxo of utxos) {
    retUtxos.push(utxo);
    total += utxo.amount;

    if (total >= sumOutputs) {
      return retUtxos;
    }
  }

  return null;
}

export async function prepareTxFunds(
  wallet: HathorWallet,
  outputs: SendTxOutput[],
  inputs: SendTxInput[],
  defaultToken = NATIVE_TOKEN_UID,
): Promise<{ inputs: PreparedInput[], outputs: SendTxOutput[] }> {
  const preparedOutputs: SendTxOutput[] = [];
  let preparedInputs: PreparedInput[] = [];

  const tokens: Map<string, TokenOutput> = new Map();

  for (const output of outputs) {
    const newOutput = { ...output };

    // If sent the new token parameter inside output, we use it
    // otherwise we try to get from old parameter in token object
    // if none exist we use default as HTR
    if (!output.token) {
      newOutput.token = defaultToken;
    }

    // Updating the `tokens` amount
    if (!tokens.has(output.token)) {
      tokens.set(output.token, {
        tokenUid: output.token,
        amount: 0,
      });
    }

    if (output.type === 'data') {
      // The data output requires that the user burns 0.01 HTR
      // this must be set here, in order to make the filter_address query
      // work if the inputs are selected by this method
      output.value = 1;
    }

    const sumObject = tokens.get(output.token);
    if (!sumObject) {
      throw new Error('Token not found when preparing tx funds.');
    }

    sumObject.amount += (output.value || 0);

    preparedOutputs.push(newOutput);
  }

  if (inputs.length > 0) {
    if (inputs[0].type === 'query') {
      const query = inputs[0];

      // query processing

      // We need to fetch UTXO's for each token on the "outputs"
      for (const element of tokens) {
        const [tokenUid, { amount }] = element;

        const queryOptions = {
          ...query,
          token: tokenUid
        };

        const utxos = await getUtxosToFillTx(wallet, amount, queryOptions);

        if (!utxos) {
          throw new NoUtxosAvailableError('No utxos available for the query filter for this amount.');
        }

        for (const utxo of utxos) {
          preparedInputs.push({
            txId: utxo.tx_id,
            index: utxo.index,
          });
        }
      }
    } else {
      preparedInputs = (inputs as SendTxInputSpecific[]).map((input) => ({
        txId: input.hash,
        index: input.index,
      }));
    }
  }

  return {
    inputs: preparedInputs,
    outputs: preparedOutputs,
  };
}
