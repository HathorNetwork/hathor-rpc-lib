/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';
import type { IHathorWallet } from '@hathor/wallet-lib';
import {
  GetXpubConfirmationResponse,
  TriggerTypes,
  GetXpubRpcRequest,
  TriggerHandler,
  RequestMetadata,
  RpcResponse,
  RpcResponseTypes,
} from '../types';
import { PromptRejectedError, InvalidParamsError } from '../errors';
import { validateNetwork } from '../helpers';

const getXpubSchema = z.object({
  network: z.string().min(1),
});

/**
 * Gets the wallet's xpub after user confirmation.
 *
 * @param rpcRequest - The RPC request containing the parameters for getting the xpub.
 * @param wallet - The wallet instance to use for retrieving the xpub.
 * @param requestMetadata - Metadata related to the dApp that sent the RPC
 * @param promptHandler - A function to handle prompts for user confirmation.
 *
 * @returns The xpub after user approval.
 *
 * @throws {PromptRejectedError} - If the user rejects the confirmation prompt.
 * @throws {InvalidParamsError} - If the request parameters are invalid.
 */
export async function getXpub(
  rpcRequest: GetXpubRpcRequest,
  wallet: IHathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
) {
  try {
    const params = getXpubSchema.parse(rpcRequest.params);
    validateNetwork(wallet, params.network);

    const xpub = wallet.xpub;

    if (!xpub) {
      throw new Error('Wallet xpub is not available');
    }

    const confirmed = await promptHandler({
      ...rpcRequest,
      type: TriggerTypes.GetXpubConfirmationPrompt,
      data: { xpub },
    }, requestMetadata) as GetXpubConfirmationResponse;

    if (!confirmed.data) {
      throw new PromptRejectedError();
    }

    return {
      type: RpcResponseTypes.GetXpubResponse,
      response: { xpub },
    } as RpcResponse;
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new InvalidParamsError(err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    throw err;
  }
}
