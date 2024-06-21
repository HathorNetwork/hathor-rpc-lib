/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet, Transaction } from '@hathor/wallet-lib';
import { validateNetwork } from '../helpers';
import {
  ConfirmationPromptTypes,
  PinConfirmationPrompt,
  PinRequestResponse,
  PromptHandler,
  SendTxConfirmationPrompt,
  SendTxConfirmationResponse,
  SendTxRpcRequest,
} from '../types';
import { prepareTxFunds } from '../helpers/transactions';
import { HATHOR_TOKEN_CONFIG } from '@hathor/wallet-lib/lib/constants';
import { PromptRejectedError } from '../errors';

/**
 * Sends a transaction using the Hathor wallet.
 *
 * @param rpcRequest - The RPC request containing transaction parameters.
 * @param wallet - The Hathor wallet instance to use for sending the transaction.
 * @param promptHandler - The handler function for prompting the user.
 *
 * @returns The transaction object that was sent.
 *
 * @throws If the transaction prompt is rejected by the user.
 */
export async function sendTx(
  rpcRequest: SendTxRpcRequest,
  wallet: HathorWallet,
  promptHandler: PromptHandler,
) {
  validateNetwork(wallet, rpcRequest.params.network);

  const preparedFundsResponse = await prepareTxFunds(
    wallet,
    rpcRequest.params.outputs,
    rpcRequest.params.inputs || [],
    rpcRequest.params.token || HATHOR_TOKEN_CONFIG.uid,
  );

  const { inputs, outputs } = preparedFundsResponse;
  const changeAddress = rpcRequest.params.changeAddress || null;

  const pinPrompt: PinConfirmationPrompt = {
    type: ConfirmationPromptTypes.PinConfirmationPrompt,
    method: rpcRequest.method,
  };

  const sendTxPrompt: SendTxConfirmationPrompt = {
    type: ConfirmationPromptTypes.SendTxConfirmationPrompt,
    method: rpcRequest.method,
    data: {
      inputs,
      outputs,
    }
  };

  const pinCodeResponse = (await promptHandler(pinPrompt)) as PinRequestResponse;

  if (!pinCodeResponse.data.accepted) {
    throw new PromptRejectedError('User rejected PIN prompt');
  }
  const sendTxResponse = (await promptHandler(sendTxPrompt)) as SendTxConfirmationResponse;

  if (!sendTxResponse.data) {
    throw new PromptRejectedError('User rejected send tx prompt');
  }

  const response: Transaction = await wallet.sendManyOutputsTransaction(outputs, {
    inputs,
    changeAddress,
    pinCode: pinCodeResponse.data.pinCode,
  });

  return response;
}
