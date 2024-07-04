/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from '@hathor/wallet-lib';
import {
  TriggerTypes,
  PinConfirmationPrompt,
  PinRequestResponse,
  TriggerHandler,
  RequestMetadata,
  SignMessageWithAddressConfirmationPrompt,
  SignMessageWithAddressConfirmationResponse,
  SignWithAddressRpcRequest,
} from '../types';
import { PromptRejectedError, SignMessageFailure } from '../errors';
import { validateNetwork } from '../helpers';
import { AddressInfoObject } from '@hathor/wallet-lib/lib/wallet/types';

/**
 * Handles the 'htr_signWithAddress' RPC request by prompting the user for confirmation
 * and signing the message if confirmed.
 * 
 * @param rpcRequest - The RPC request object containing the method and parameters.
 * @param wallet - The Hathor wallet instance used to sign the message.
 * @param promptHandler - The function to handle prompting the user for confirmation.
 *
 * @returns The signed message if the user confirms.
 *
 * @throws {PromptRejectedError} If the user rejects any of the prompts.
 */
export async function signWithAddress(
  rpcRequest: SignWithAddressRpcRequest,
  wallet: HathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
) {
  validateNetwork(wallet, rpcRequest.params.network);

  const message = rpcRequest.params.message;

  const base58: string = await wallet.getAddressAtIndex(rpcRequest.params.addressIndex);
  const index: number = await wallet.getAddressIndex(base58);
  const addressPath: string = await wallet.getAddressPathForIndex(index);
  const address: AddressInfoObject = {
    address: base58,
    index,
    addressPath,
    info: undefined, // The type must be updated in the lib to make this optional
  };

  const prompt: SignMessageWithAddressConfirmationPrompt = {
    type: TriggerTypes.SignMessageWithAddressConfirmationPrompt,
    method: rpcRequest.method,
    data: {
      address,
      message: rpcRequest.params.message,
    }
  };

  const signResponse = await promptHandler(prompt, requestMetadata) as SignMessageWithAddressConfirmationResponse;

  if (!signResponse.data) {
    throw new PromptRejectedError('User rejected sign message prompt');
  }

  const pinPrompt: PinConfirmationPrompt = {
    type: TriggerTypes.PinConfirmationPrompt,
    method: rpcRequest.method,
  };

  const pinResponse = await promptHandler(pinPrompt, requestMetadata) as PinRequestResponse;

  console.log('Pin response: ', pinResponse);

  if (!pinResponse.data.accepted) {
    throw new PromptRejectedError('User rejected PIN prompt');
  }

  try {
    const signature = await wallet.signMessageWithAddress(
      rpcRequest.params.message,
      rpcRequest.params.addressIndex,
      pinResponse.data.pinCode,
    );

    return {
      message,
      signature,
      address,
    };
  } catch (e) {
    throw new SignMessageFailure();
  }
}
