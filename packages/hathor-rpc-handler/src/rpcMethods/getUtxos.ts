/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { z } from 'zod';
import type { HathorWallet } from '@hathor/wallet-lib';
import {
  GetUtxosConfirmationResponse,
  GetUtxosRpcRequest,
  TriggerHandler,
  RequestMetadata,
  UtxoDetails,
  RpcResponseTypes,
  RpcResponse,
  RpcMethods,
} from '../types';
import { PromptRejectedError, InvalidParamsError } from '../errors';
import { TriggerTypes } from '../types';
import { validateNetwork } from '../helpers';

const getUtxosSchema = z.object({
  method: z.literal(RpcMethods.GetUtxos),
  params: z.object({
    network: z.string().min(1),
    maxUtxos: z.number().default(255),
    token: z.string().default('HTR'),
    filterAddress: z.string(),
    authorities: z.number().default(0),
    amountSmallerThan: z.number().min(0).default(0),
    amountBiggerThan: z.number().min(0).default(0),
    maximumAmount: z.number().default(0),
    onlyAvailableUtxos: z.boolean().default(true),
  }).transform(data => ({
    ...data,
    max_utxos: data.maxUtxos,
    filter_address: data.filterAddress,
    amount_smaller_than: data.amountSmallerThan,
    amount_bigger_than: data.amountBiggerThan,
    max_amount: data.maximumAmount,
    only_available_utxos: data.onlyAvailableUtxos,
  })),
});

/**
 * Handles the 'htr_getUtxos' RPC request by prompting the user for confirmation
 * and returning the UTXO details if confirmed.
 * 
 * @param rpcRequest - The RPC request object containing the method and parameters.
 * @param wallet - The Hathor wallet instance used to get the UTXOs.
 * @param requestMetadata - Metadata related to the dApp that sent the RPC
 * @param promptHandler - The function to handle prompting the user for confirmation.
 *
 * @returns The UTXO details from the wallet if the user confirms.
 *
 * @throws {InvalidParamsError} If the RPC request parameters are invalid.
 * @throws {Error} If the method is not implemented in the wallet-service facade.
 * @throws {PromptRejectedError} If the user rejects the prompt.
 */
export async function getUtxos(
  rpcRequest: GetUtxosRpcRequest,
  wallet: HathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
) {
  try {
    const validatedRequest = getUtxosSchema.parse(rpcRequest);
    const { params } = validatedRequest;

    validateNetwork(wallet, params.network);

    // Extract only the snake_case properties that the wallet.getUtxos expects
    const options = {
      'token': params.token,
      'authorities': params.authorities,
      'max_utxos': params.max_utxos,
      'filter_address': params.filter_address,
      'amount_smaller_than': params.amount_smaller_than,
      'amount_bigger_than': params.amount_bigger_than,
      'max_amount': params.max_amount,
      'only_available_utxos': params.only_available_utxos,
    };

    // We have the same issues here that we do have in the headless wallet:
    // TODO: Memory usage enhancements are required here as wallet.getUtxos can cause issues on
    // wallets with a huge amount of utxos.
    // TODO: This needs to be paginated.
    const utxoDetails: UtxoDetails[] = await wallet.getUtxos(options);

    const confirmed = await promptHandler({
      type: TriggerTypes.GetUtxosConfirmationPrompt,
      method: rpcRequest.method,
      data: utxoDetails
    }, requestMetadata) as GetUtxosConfirmationResponse;

    if (!confirmed.data) {
      throw new PromptRejectedError();
    }

    return {
      type: RpcResponseTypes.GetUtxosResponse,
      response: utxoDetails,
    } as RpcResponse;
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new InvalidParamsError(err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    throw err;
  }
}
