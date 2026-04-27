/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';
import type { IHathorWallet, Transaction } from '@hathor/wallet-lib';
import {
  TriggerTypes,
  PinConfirmationPrompt,
  PinRequestResponse,
  TriggerHandler,
  RequestMetadata,
  SendNanoContractRpcRequest,
  SendNanoContractTxConfirmationPrompt,
  SendNanoContractTxLoadingTrigger,
  RpcResponseTypes,
  RpcResponse,
  SendNanoContractTxLoadingFinishedTrigger,
} from '../types';
import { PromptRejectedError, SendNanoContractTxError, InvalidParamsError } from '../errors';
import { INanoContractActionSchema, NanoContractAction, ncApi, nanoUtils, Network, config, HathorWallet } from '@hathor/wallet-lib';
import { bigIntCoercibleSchema } from '@hathor/wallet-lib/lib/utils/bigint';
import type { ISendTransaction } from '@hathor/wallet-lib/lib/wallet/types';
import { fetchTokenDetails } from '../helpers';
import { sendNanoContractTxConfirmationResponseSchema } from '../schemas';


export type NanoContractActionWithStringAmount = Omit<NanoContractAction, 'amount'> & {
  amount: string,
}

const sendNanoContractSchema = z.object({
  network: z.string().min(1),
  method: z.string().min(1),
  blueprint_id: z.string().nullish(),
  nc_id: z.string().nullish(),
  actions: z.array(INanoContractActionSchema),
  args: z.array(z.unknown()).default([]),
  max_fee: bigIntCoercibleSchema.optional(),
  contract_pays_fees: z.boolean().optional(),
  push_tx: z.boolean().default(true),
}).transform(data => ({
  ...data,
  blueprintId: data.blueprint_id || null,
  ncId: data.nc_id || null,
  pushTx: data.push_tx,
  ...(data.max_fee !== undefined && { maxFee: data.max_fee }),
  ...(data.contract_pays_fees !== undefined && { contractPaysFees: data.contract_pays_fees }),
})).refine(
  (data) => data.blueprintId || data.ncId,
  "Either blueprint_id or nc_id must be provided"
);

/**
 * Sends a nano contract transaction.
 *
 * This function prompts the user for a PIN code and address, then uses these 
 * to create and send a nano contract transaction based on the provided parameters.
 *
 * @param rpcRequest - The RPC request containing transaction details.
 * @param wallet - The wallet instance to create/send the transaction.
 * @param requestMetadata - Metadata related to the dApp that sent the RPC
 * @param triggerHandler - The handler to manage user prompts.
 *
 * @returns The response from the transaction.
 *
 * @throws {SendNanoContractTxError} - If the transaction fails.
 */
export async function sendNanoContractTx(
  rpcRequest: SendNanoContractRpcRequest,
  wallet: IHathorWallet,
  requestMetadata: RequestMetadata,
  triggerHandler: TriggerHandler,
) {
  try {
    const params = sendNanoContractSchema.parse(rpcRequest.params);

    const pinPrompt: PinConfirmationPrompt = {
      ...rpcRequest,
      type: TriggerTypes.PinConfirmationPrompt,
    };

    config.setServerUrl(wallet.getServerUrl());
    let blueprintId = params.blueprintId;
    if (blueprintId) {
      // Check if the user sent a valid blueprint id
      try {
        await ncApi.getBlueprintInformation(blueprintId);
      } catch (e) {
        // Invalid blueprint id
        throw new SendNanoContractTxError(
          `Invalid blueprint ID ${blueprintId}`
        );
      }
    }

    if (!blueprintId) {
      try {
        blueprintId = await nanoUtils.getBlueprintId(params.ncId!, wallet as unknown as HathorWallet);
      } catch {
        // Error getting blueprint ID
        throw new SendNanoContractTxError(
          `Error getting blueprint id with nc id ${params.ncId} from the full node`
        );
      }
    }

    const result = await nanoUtils.validateAndParseBlueprintMethodArgs(blueprintId!, params.method, params.args, new Network(params.network));
    const parsedArgs = result.map((data) => {
      return { ...data, parsed: data.field.toUser() };
    });

    // Extract token UIDs from actions and fetch their details
    const tokenUids = params.actions
      .filter((action): action is NanoContractAction & { token: string } => 'token' in action && typeof action.token === 'string')
      .map(action => action.token);
    const tokenDetails = await fetchTokenDetails(wallet, tokenUids);

    // Pre-build transaction to calculate fees
    const tempCallerAddress = await wallet.getAddressAtIndex(0);
    if (!tempCallerAddress || tempCallerAddress.trim() === '') {
      throw new SendNanoContractTxError('Unable to get wallet address at index 0');
    }
    const preBuildTxData = {
      ncId: params.ncId,
      blueprintId,
      actions: params.actions,
      args: params.args,
    };

    const preBuildSendTx: ISendTransaction = await wallet.createNanoContractTransaction(
      params.method,
      tempCallerAddress,
      preBuildTxData,
      {
        ...(params.maxFee !== undefined && { maxFee: params.maxFee }),
        ...(params.contractPaysFees !== undefined && { contractPaysFees: params.contractPaysFees }),
        signTx: false,
      },
    );

    if (!preBuildSendTx.transaction) {
      throw new SendNanoContractTxError('Unable to create transaction object');
    }

    // Extract fee from pre-built transaction
    const feeHeader = preBuildSendTx.transaction?.getFeeHeader?.();
    if (feeHeader && feeHeader.entries.some(entry => entry.tokenIndex !== 0)) {
      throw new SendNanoContractTxError('Unexpected fee entry with non-HTR token index');
    }
    // Sum all fee entries for HTR token (index 0)
    const fee = feeHeader
      ? feeHeader.entries.reduce((sum, entry) => sum + entry.amount, 0n)
      : 0n;

    const sendNanoContractTxPrompt: SendNanoContractTxConfirmationPrompt = {
      ...rpcRequest,
      type: TriggerTypes.SendNanoContractTxConfirmationPrompt,
      data: {
        blueprintId,
        ncId: params.ncId,
        actions: params.actions,
        method: params.method,
        args: params.args,
        parsedArgs,
        pushTx: params.pushTx,
        tokenDetails,
        fee,
        contractPaysFees: params.contractPaysFees ?? false,
        preparedTx: preBuildSendTx.transaction,
      },
    };

    const rawResponse = await triggerHandler(sendNanoContractTxPrompt, requestMetadata);

    // Parse and validate the entire response with Zod
    const responseValidation = sendNanoContractTxConfirmationResponseSchema.safeParse(rawResponse);
    if (!responseValidation.success) {
      throw new SendNanoContractTxError(responseValidation.error.errors.map(e => e.message).join(', '));
    }

    const sendNanoContractTxResponse = responseValidation.data;

    if (!sendNanoContractTxResponse.data.accepted) {
      await preBuildSendTx.releaseUtxos();
      throw new PromptRejectedError();
    }

    const confirmedCaller = sendNanoContractTxResponse.data.nc.caller;

    const pinCodeResponse: PinRequestResponse = (await triggerHandler(pinPrompt, requestMetadata)) as PinRequestResponse;

    if (!pinCodeResponse.data.accepted) {
      await preBuildSendTx.releaseUtxos();
      throw new PromptRejectedError('Pin prompt rejected');
    }

    try {
      const sendNanoContractLoadingTrigger: SendNanoContractTxLoadingTrigger = {
        type: TriggerTypes.SendNanoContractTxLoadingTrigger,
      };
      triggerHandler(sendNanoContractLoadingTrigger, requestMetadata);


      let response: Transaction | string;
      
      // If caller changed, update the pre-built transaction
      if (confirmedCaller !== tempCallerAddress) {
        const nanoHeaders = preBuildSendTx.transaction.getNanoHeaders();
        if (!nanoHeaders || nanoHeaders.length === 0) {
          throw new SendNanoContractTxError('No nano headers found in the transaction');
        }
        await wallet.setNanoHeaderCaller(nanoHeaders[0], confirmedCaller);
      }

      await wallet.signTx(preBuildSendTx.transaction, { pinCode: pinCodeResponse.data.pinCode });

      if (params.pushTx) {
        response = await preBuildSendTx.runFromMining();
      } else {
        // Convert the transaction object to hex format for the response
        response = preBuildSendTx.transaction.toHex();
      }

      const sendNanoContractLoadingFinishedTrigger: SendNanoContractTxLoadingFinishedTrigger = {
        type: TriggerTypes.SendNanoContractTxLoadingFinishedTrigger,
      };
      triggerHandler(sendNanoContractLoadingFinishedTrigger, requestMetadata);

      return {
        type: RpcResponseTypes.SendNanoContractTxResponse,
        response,
      } as RpcResponse;
    } catch (err) {
      await preBuildSendTx.releaseUtxos();
      if (err instanceof Error) {
        throw new SendNanoContractTxError(err.message);
      } else {
        throw new SendNanoContractTxError('An unknown error occurred');
      }
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new InvalidParamsError(err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    // Convert BigInt conversion errors to consistent InvalidParamsError for better API error handling
    if (err instanceof SyntaxError && err.message.includes('Cannot convert')) {
      throw new InvalidParamsError(`Invalid number format: ${err.message}`);
    }
    throw err;
  }
}
