/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';
import type { IHathorWallet } from '@hathor/wallet-lib';
import {
  AddressRequestClientResponse,
  AddressRequestConfirmationResponse,
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

const baseSchema = {
  network: z.string().min(1),
};

export const getAddressSchema = z.discriminatedUnion("type", [
  z.object(baseSchema).merge(z.object({
    type: z.literal('first_empty'),
  })),
  z.object(baseSchema).merge(z.object({
    type: z.literal('full_path'),
    full_path: z.string().min(1),
  })),
  z.object({
    type: z.literal('index'),
    index: z.number().int().nonnegative(),
    ...baseSchema,
  }),
  z.object({
    type: z.literal('client'),
    ...baseSchema,
  }),
]).transform(data => {
  if (data.type === 'full_path') {
    return {
      ...data,
      fullPath: data.full_path,
    };
  }
  return data;
});

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
  wallet: IHathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
) {
  try {
    const params = getAddressSchema.parse(rpcRequest.params);
    validateNetwork(wallet, params.network);

    let addressInfo: AddressInfoObject;

    switch (params.type) {
      case 'first_empty':
        addressInfo = await wallet.getCurrentAddress();
        break;
      case 'full_path':
        throw new NotImplementedError();
      case 'index': {
        const address = await wallet.getAddressAtIndex(params.index);
        const addressPath = await wallet.getAddressPathForIndex(params.index);
        addressInfo = { address, index: params.index, addressPath };
        break;
      }
      case 'client': {
        const response = (await promptHandler({
          ...rpcRequest,
          type: TriggerTypes.AddressRequestClientPrompt,
        }, requestMetadata)) as AddressRequestClientResponse;

        const address = response.data.address;
        const index = await wallet.getAddressIndex(address);
        if (index == null) {
          throw new InvalidParamsError('Client sent an invalid address');
        }
        const addressPath = await wallet.getAddressPathForIndex(index);
        addressInfo = { address, index, addressPath };
        break;
      }
    }

    // We already confirmed with the user and he selected the address he wanted
    // to share. No need to double check
    if (params.type !== 'client') {
      const confirmed = await promptHandler({
        ...rpcRequest,
        type: TriggerTypes.AddressRequestPrompt,
        data: addressInfo,
      }, requestMetadata) as AddressRequestConfirmationResponse;

      if (!confirmed.data) {
        throw new PromptRejectedError();
      }
    }

    return {
      type: RpcResponseTypes.GetAddressResponse,
      response: addressInfo as AddressInfoObject,
    } as RpcResponse;
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new InvalidParamsError(err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    throw err;
  }
}
