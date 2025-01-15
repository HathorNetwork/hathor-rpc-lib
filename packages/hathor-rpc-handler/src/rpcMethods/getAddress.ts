/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';
import type { HathorWallet } from '@hathor/wallet-lib';
import {
  AddressRequestClientResponse,
  TriggerTypes,
  GetAddressRpcRequest,
  TriggerHandler,
  RequestMetadata,
  RpcResponse,
  RpcResponseTypes,
} from '../types';
import { NotImplementedError, PromptRejectedError, InvalidParamsError } from '../errors';
import { validateNetwork } from '../helpers';
import type { AddressInfoObject } from '@hathor/wallet-lib/lib/wallet/types';

const getAddressSchema = z.object({
  type: z.enum(['first_empty', 'full_path', 'index', 'client']),
  index: z.number().int().nonnegative().optional(),
  full_path: z.string().min(1).optional(),
  network: z.string().min(1),
}).refine(
  (data) => {
    if (data.type === 'index') {
      return data.index !== undefined;
    }
    if (data.type === 'full_path') {
      return data.full_path !== undefined;
    }
    return true;
  },
  {
    message: "index is required when type is 'index', full_path is required when type is 'full_path'",
  }
);

/**
 * Gets an address based on the provided rpcRequest and wallet.
 *
 * @param rpcRequest - The RPC request containing the parameters for getting an address.
 * @param wallet - The wallet instance to use for retrieving the address.
 * @param requestMetadata - Metadata related to the dApp that sent the RPC
 * @param promptHandler - A function to handle prompts for user confirmation.
 *
 * @returns The address retrieved based on the request parameters.
 *
 * @throws {NotImplementedError} - If the request type is 'full_path', which is not implemented.
 * @throws {PromptRejectedError} - If the user rejects the address confirmation prompt.
 * @throws {InvalidParamsError} - If the request parameters are invalid.
 */
export async function getAddress(
  rpcRequest: GetAddressRpcRequest,
  wallet: HathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
) {
  try {
    const params = getAddressSchema.parse(rpcRequest.params);
    validateNetwork(wallet, params.network);

    let address: string;

    switch (params.type) {
      case 'first_empty':
        address = await wallet.getCurrentAddress();
      break;
      case 'full_path':
        throw new NotImplementedError();
      case 'index':
        address = await wallet.getAddressAtIndex(params.index!);
      break;
      case 'client': {
        const response = (await promptHandler({
          type: TriggerTypes.AddressRequestClientPrompt,
          method: rpcRequest.method,
        }, requestMetadata)) as AddressRequestClientResponse;

        address = response.data.address;
      }
      break;
    }

    // We already confirmed with the user and he selected the address he wanted
    // to share. No need to double check
    if (params.type !== 'client') {
      const confirmed = await promptHandler({
        type: TriggerTypes.AddressRequestPrompt,
        method: rpcRequest.method,
        data: {
          address,
        }
      }, requestMetadata);

      if (!confirmed) {
        throw new PromptRejectedError();
      }
    }

    return {
      type: RpcResponseTypes.GetAddressResponse,
      response: address as unknown as AddressInfoObject,
    } as RpcResponse;
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new InvalidParamsError(err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    throw err;
  }
}
