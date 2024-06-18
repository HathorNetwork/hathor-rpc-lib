/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from '@hathor/wallet-lib';
import { ConfirmationPromptTypes, PinConfirmationPrompt, PromptHandler, SignMessageWithAddressConfirmationPrompt, SignWithAddressRpcRequest } from '../types';
import { PromptRejectedError } from '../errors';
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
  promptHandler: PromptHandler,
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
    type: ConfirmationPromptTypes.SignMessageWithAddress,
    method: rpcRequest.method,
    data: {
      address,
      message: rpcRequest.params.message,
    }
  };

  const confirmed = await promptHandler(prompt);

  if (!confirmed) {
    throw new PromptRejectedError();
  }

  const pinPrompt: PinConfirmationPrompt = {
    type: ConfirmationPromptTypes.PinConfirmationPrompt,
    method: rpcRequest.method,
  };

  try {
    const pinCode = await promptHandler(pinPrompt);
    const signature = await wallet.signMessageWithAddress(
      rpcRequest.params.message,
      rpcRequest.params.addressIndex,
      pinCode,
    );

    return {
      message,
      signature,
      address,
    };
  } catch (e) {
    throw new PromptRejectedError();
  }
}
