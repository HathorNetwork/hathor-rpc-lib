/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  IHathorWallet,
  nanoUtils,
  Network,
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

export const signOracleDataSchema = z.object({
  nc_id: z.string(),
  network: z.string().min(1),
  oracle: z.string().min(1),
  data: z.string().min(1),
});

export async function signOracleData(
  rpcRequest: SignOracleDataRpcRequest,
  wallet: IHathorWallet,
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
    ...rpcRequest,
    type: TriggerTypes.SignOracleDataConfirmationPrompt,
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
    ...rpcRequest,
    type: TriggerTypes.PinConfirmationPrompt,
  };

  const pinResponse = await promptHandler(pinPrompt, requestMetadata) as PinRequestResponse;

  if (!pinResponse.data.accepted) {
    throw new PromptRejectedError('User rejected PIN prompt');
  }

  // We only support strings from the RPC
  const type = 'str';
  const resultPreSerialized = params.data;

  const oracleDataBuffer = nanoUtils.getOracleBuffer(params.oracle, new Network(params.network))

  const signedData = await nanoUtils.getOracleSignedDataFromUser(
    oracleDataBuffer,
    params.nc_id,
    `SignedData[${type}]`,
    resultPreSerialized,
    wallet,
    { pinCode: pinResponse.data.pinCode }
  );

  return {
    type: RpcResponseTypes.SignOracleDataResponse,
    response: {
      data: params.data,
      signedData,
      oracle: params.oracle,
    }
  } as SignOracleDataResponse;
}
