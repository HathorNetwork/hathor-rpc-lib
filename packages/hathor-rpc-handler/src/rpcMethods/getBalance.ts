/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet, constants } from '@hathor/wallet-lib';
import { GetBalanceObject } from '@hathor/wallet-lib/lib/wallet/types';
import { ConfirmationPrompt, ConfirmationPromptTypes, GetBalanceRpcRequest, PromptHandler } from '../types';
import { PromptRejectedError } from '../errors';

/**
 * Handles the 'get_balance' RPC request by prompting the user for confirmation
 * and returning the balance if confirmed.
 * 
 * @param rpcRequest - The RPC request object containing the method and parameters.
 * @param wallet - The Hathor wallet instance used to get the balance.
 * @param promptHandler - The function to handle prompting the user for confirmation.
 *
 * @returns The balance from the wallet if the user confirms.
 *
 * @throws {Error} If the RPC request method is not 'get_balance'.
 * @throws {PromptRejectedError} If the user rejects the prompt.
 */
export async function getBalance(
  rpcRequest: GetBalanceRpcRequest,
  wallet: HathorWallet,
  promptHandler: PromptHandler,
) {
  const token = rpcRequest.params.token || constants.HATHOR_TOKEN_CONFIG.uid;

  const balances: GetBalanceObject[] = await wallet.getBalance(token);

  const prompt: ConfirmationPrompt = {
    type: ConfirmationPromptTypes.GenericConfirmationPrompt,
    method: rpcRequest.method,
    data: balances
  };

  const confirmed = await promptHandler(prompt);

  if (!confirmed) {
    throw new PromptRejectedError();
  }

  return balances;
}
