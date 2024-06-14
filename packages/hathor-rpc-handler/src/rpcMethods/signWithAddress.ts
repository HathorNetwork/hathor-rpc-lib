/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from '@hathor/wallet-lib';
import { PinConfirmationPrompt, PromptHandler, SignMessageWithAddressConfirmationPrompt, SignWithAddressRpcRequest } from '../types';
import { PromptRejectedError } from '../errors';

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
  const address = wallet.getAddressAtIndex(rpcRequest.params.addressIndex);

  const prompt: SignMessageWithAddressConfirmationPrompt = {
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
    method: rpcRequest.method,
  };

  try {
    const pinCode = await promptHandler(pinPrompt);
    const signedMessage = await wallet.signMessageWithAddress(
      rpcRequest.params.message,
      rpcRequest.params.addressIndex,
      pinCode,
    );

    return signedMessage;
  } catch (e) {
    throw new PromptRejectedError();
  }
}
