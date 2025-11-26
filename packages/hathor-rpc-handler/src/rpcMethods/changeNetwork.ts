/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from "zod";
import type { IHathorWallet } from "@hathor/wallet-lib";
import {
  ChangeNetworkRequestConfirmationResponse,
  ChangeNetworkRpcRequest,
  TriggerTypes,
  TriggerHandler,
  RequestMetadata,
  RpcResponse,
  RpcResponseTypes,
} from "../types";
import { PromptRejectedError, InvalidParamsError } from "../errors";
import { validateNetwork } from "../helpers";

const schema = z.object({
  network: z.string().min(1),
  newNetwork: z.string().min(1),
});

/**
 * This method only handles the approval and schema validation for changing a network.
 *
 * It doesn't actually do anything, just handles the prompt confirmation.
 *
 * @param {ChangeNetworkRpcRequest} rpcRequest - The RPC request object containing the new network
 * @param wallet - The wallet instance that will be used.
 * @param requestMetadata - Metadata associated with the request, such as the request ID
 *   and other contextual information.
 * @param triggerHandler - A function that handles triggering user prompts, such as
 *   confirmations and PIN entry.
 *
 * @returns An object containing the new network.
 */
export async function changeNetwork(
  rpcRequest: ChangeNetworkRpcRequest,
  wallet: IHathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
) {
  try {
    const params = schema.parse(rpcRequest.params);
    validateNetwork(wallet, params.network);

    const confirmed = (await promptHandler(
      {
        ...rpcRequest,
        type: TriggerTypes.ChangeNetworkConfirmationPrompt,
        data: {
          newNetwork: params.newNetwork,
        },
      },
      requestMetadata,
    )) as ChangeNetworkRequestConfirmationResponse;

    if (!confirmed.data) {
      throw new PromptRejectedError();
    }

    return {
      type: RpcResponseTypes.ChangeNetworkResponse,
      response: {
        newNetwork: params.newNetwork,
      },
    } as RpcResponse;
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new InvalidParamsError(
        err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
      );
    }
    throw err;
  }
}
