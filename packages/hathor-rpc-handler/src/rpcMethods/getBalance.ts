/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';
import type { IHathorWallet } from '@hathor/wallet-lib';
import type { GetBalanceObject } from '@hathor/wallet-lib/lib/wallet/types';
import {
  TriggerTypes,
  GetBalanceConfirmationPrompt,
  GetBalanceRpcRequest,
  TriggerHandler,
  RequestMetadata,
  RpcResponseTypes,
  RpcResponse,
  GetBalanceConfirmationResponse,
} from '../types';
import { NotImplementedError, PromptRejectedError, InvalidParamsError } from '../errors';
import { validateNetwork } from '../helpers';

const getBalanceSchema = z.object({
  network: z.string().min(1),
  tokens: z.array(z.string().min(1)).min(1),
  addressIndexes: z.array(z.number().int().nonnegative()).optional(),
});

/**
 * Gets the balance for specified tokens using the provided wallet.
 *
 * @param rpcRequest - The RPC request containing the parameters for getting the balance.
 * @param wallet - The wallet instance to use for retrieving the balance.
 * @param requestMetadata - Metadata related to the dApp that sent the RPC
 * @param promptHandler - A function to handle prompts for user confirmation.
 *
 * @returns The balances of the specified tokens.
 *
 * @throws {NotImplementedError} - If address indexes are specified, which is not implemented.
 * @throws {PromptRejectedError} - If the user rejects the balance confirmation prompt.
 * @throws {InvalidParamsError} - If the request parameters are invalid.
 */
export async function getBalance(
  rpcRequest: GetBalanceRpcRequest,
  wallet: IHathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
) {
  const parseResult = getBalanceSchema.safeParse(rpcRequest.params);

  if (!parseResult.success) {
    throw new InvalidParamsError(parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
  }

  const params = parseResult.data;

  if (params.addressIndexes) {
    throw new NotImplementedError();
  }

  validateNetwork(wallet, params.network);

  const balances: GetBalanceObject[] = (await Promise.all(
    params.tokens.map(token => wallet.getBalance(token)),
  )).flat();

  const prompt: GetBalanceConfirmationPrompt = {
    ...rpcRequest,
    type: TriggerTypes.GetBalanceConfirmationPrompt,
    data: balances
  };

  const confirmed = await promptHandler(
    prompt,
    requestMetadata
  ) as GetBalanceConfirmationResponse;

  if (!confirmed.data) {
    throw new PromptRejectedError();
  }

  return {
    type: RpcResponseTypes.GetBalanceResponse,
    response: balances,
  } as RpcResponse;
}
