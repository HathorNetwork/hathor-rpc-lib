/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';
import type { IHathorWallet } from '@hathor/wallet-lib';
import type { GetHistoryObject } from '@hathor/wallet-lib/lib/wallet/types';
import {
  TriggerTypes,
  GetHistoryConfirmationPrompt,
  GetHistoryRpcRequest,
  TriggerHandler,
  RequestMetadata,
  RpcResponseTypes,
  RpcResponse,
  GetHistoryConfirmationResponse,
} from '../types';
import { PromptRejectedError, InvalidParamsError } from '../errors';
import { validateNetwork } from '../helpers';

const getHistorySchema = z.object({
  network: z.string().min(1),
  token_id: z.string().optional(),
  count: z.number().int().positive().optional(),
  skip: z.number().int().nonnegative().optional(),
});

/**
 * Gets the transaction history for the wallet.
 *
 * @param rpcRequest - The RPC request containing the parameters for getting the history.
 * @param wallet - The wallet instance to use for retrieving the history.
 * @param requestMetadata - Metadata related to the dApp that sent the RPC
 * @param promptHandler - A function to handle prompts for user confirmation.
 *
 * @returns The transaction history of the wallet.
 *
 * @throws {PromptRejectedError} - If the user rejects the history confirmation prompt.
 * @throws {InvalidParamsError} - If the request parameters are invalid.
 */
export async function getHistory(
  rpcRequest: GetHistoryRpcRequest,
  wallet: IHathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
) {
  const parseResult = getHistorySchema.safeParse(rpcRequest.params);

  if (!parseResult.success) {
    throw new InvalidParamsError(parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
  }

  const params = parseResult.data;

  validateNetwork(wallet, params.network);

  const history: GetHistoryObject[] = await wallet.getTxHistory({
    token_id: params.token_id,
    count: params.count,
    skip: params.skip,
  });

  const prompt: GetHistoryConfirmationPrompt = {
    ...rpcRequest,
    type: TriggerTypes.GetHistoryConfirmationPrompt,
    data: history
  };

  const confirmed = await promptHandler(
    prompt,
    requestMetadata
  ) as GetHistoryConfirmationResponse;

  if (!confirmed.data) {
    throw new PromptRejectedError();
  }

  return {
    type: RpcResponseTypes.GetHistoryResponse,
    response: history,
  } as RpcResponse;
}
