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
  NanoContractSerializer,
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
  try {
    const params = signOracleDataSchema.parse(rpcRequest.params);
    
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

    const oracleData = nanoUtils.getOracleBuffer(params.oracle, wallet.getNetworkObject());
    const nanoSerializer = new NanoContractSerializer();
    const dataSerialized = nanoSerializer.serializeFromType(params.data, 'str');

    // TODO getOracleInputData method should be able to receive the PIN as optional parameter as well
    wallet.pinCode = pinResponse.data.pinCode;
    const inputData = await nanoUtils.getOracleInputData(oracleData, dataSerialized, wallet);
    const signature = `${bufferUtils.bufferToHex(inputData)},${params.data},str`;

    return {
      type: RpcResponseTypes.SignOracleDataResponse,
      response: {
        data: params.data,
        signature,
        oracle: params.oracle,
      }
    } as SignOracleDataResponse;
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new InvalidParamsError(err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    throw err;
  }
}
