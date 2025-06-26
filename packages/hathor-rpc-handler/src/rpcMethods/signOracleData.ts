/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  HathorWallet,
  nanoUtils,
  bufferUtils,
} from '@hathor/wallet-lib';
import {
  TriggerHandler,
  RequestMetadata,
  SignOracleDataRpcRequest,
  PinRequestResponse,
  PinConfirmationPrompt,
  TriggerTypes,
  RpcResponseTypes,
  SignOracleDataResponse,
  SignOracleDataConfirmationPrompt,
  SignOracleDataConfirmationResponse,
} from '../types';
import { validateNetwork } from '../helpers';
import { PromptRejectedError, InvalidParamsError } from '../errors';
import { z } from 'zod';

const signOracleDataSchema = z.object({
  nc_id: z.string(),
  network: z.string().min(1),
  oracle: z.string().min(1),
  data: z.string().min(1),
});

export async function signOracleData(
  rpcRequest: SignOracleDataRpcRequest,
  wallet: HathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
) {
  const parseResult = signOracleDataSchema.safeParse(rpcRequest.params);

  if (!parseResult.success) {
    throw new InvalidParamsError(parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
  }

  const params = parseResult.data;
  validateNetwork(wallet, params.network);

  const prompt: SignOracleDataConfirmationPrompt = {
    type: TriggerTypes.SignOracleDataConfirmationPrompt,
    method: rpcRequest.method,
    data: {
      oracle: params.oracle,
      data: params.data,
    }
  };

  const signResponse = await promptHandler(prompt, requestMetadata) as SignOracleDataConfirmationResponse;

  if (!signResponse.data) {
    throw new PromptRejectedError('User rejected sign oracle data prompt');
  }

  const pinPrompt: PinConfirmationPrompt = {
    type: TriggerTypes.PinConfirmationPrompt,
    method: rpcRequest.method,
  };

  const pinResponse = await promptHandler(pinPrompt, requestMetadata) as PinRequestResponse;

  if (!pinResponse.data.accepted) {
    throw new PromptRejectedError('User rejected PIN prompt');
  }

  // We only support strings from the RPC
  const type = 'str';
  const resultPreSerialized = params.data;

  const oracleDataBuffer = bufferUtils.hexToBuffer(params.oracle);
  
  // TODO: getOracleSignedDataFromUser method should be able to receive the PIN as optional parameter as well
  wallet.pinCode = pinResponse.data.pinCode;
  
  const signedResult = await nanoUtils.getOracleSignedDataFromUser(
    oracleDataBuffer,
    params.nc_id,
    `SignedData[${type}]`,
    resultPreSerialized,
    wallet
  );

  return {
    type: RpcResponseTypes.SignOracleDataResponse,
    response: {
      data: params.data,
      signature: String(signedResult),
      oracle: params.oracle,
    }
  } as SignOracleDataResponse;
}
