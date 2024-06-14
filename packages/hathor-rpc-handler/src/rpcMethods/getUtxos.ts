/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { HathorWallet, HathorWalletServiceWallet } from '@hathor/wallet-lib';
import { GetUtxosRpcRequest, PromptHandler, UtxoDetails } from '../types';
import { InvalidRpcMethod, PromptRejectedError } from '../errors';

/**
 * Handles the 'htr_getUtxos' RPC request by prompting the user for confirmation
 * and returning the UTXO details if confirmed.
 * 
 * @param rpcRequest - The RPC request object containing the method and parameters.
 * @param wallet - The Hathor wallet instance used to get the UTXOs.
 * @param promptHandler - The function to handle prompting the user for confirmation.
 *
 * @returns The UTXO details from the wallet if the user confirms.
 *
 * @throws {InvalidRpcMethod} If the RPC request method is not 'htr_getUtxos'.
 * @throws {Error} If the method is not implemented in the wallet-service facade.
 * @throws {PromptRejectedError} If the user rejects the prompt.
 */
export async function getUtxos(
  rpcRequest: GetUtxosRpcRequest,
  wallet: HathorWallet,
  promptHandler: PromptHandler,
) {
  // TODO: The facades have different signatures, the wallet-service method does
  // not have the `amountSmallerThan` and the `amountBiggerThan` parameters.
  // We need to implement them and use the method here.
  if (wallet instanceof HathorWalletServiceWallet) {
    throw new Error('This method is not yet implemented in the wallet-service facade');
  }

  const options = {
    'token': rpcRequest.params.token,
    'authorities': 0,
    'max_utxos': rpcRequest.params.maxUtxos,
    'filter_address': rpcRequest.params.filterAddress,
    'amount_smaller_than': rpcRequest.params.amountSmallerThan,
    'amount_bigger_than': rpcRequest.params.amountBiggerThan,
    'max_amount': rpcRequest.params.maximumAmount,
    'only_available_utxos': rpcRequest.params.onlyAvailableUtxos,
  };

  // We have the same issues here that we do have in the headless wallet:
  // TODO: Memory usage enhancements are required here as wallet.getUtxos can cause issues on
  // wallets with a huge amount of utxos.
  // TODO: This needs to be paginated.
  const utxoDetails: UtxoDetails = await wallet.getUtxos(options);

  const confirmed = await promptHandler({
    method: rpcRequest.method,
    data: utxoDetails
  });

  if (!confirmed) {
    throw new PromptRejectedError();
  }

  return utxoDetails;
}

