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
  CreateNanoContractCreateTokenTxRpcRequest,
  RpcResponseTypes,
  CreateNanoContractCreateTokenTxResponse,
  CreateNanoContractCreateTokenTxConfirmationPrompt,
  CreateNanoContractCreateTokenTxLoadingTrigger,
  CreateNanoContractCreateTokenTxLoadingFinishedTrigger,
  NanoContractParams,
} from '../types';
import { PromptRejectedError, InvalidParamsError, SendNanoContractTxError } from '../errors';
import { INanoContractActionSchema } from '@hathor/wallet-lib';
import { bigIntCoercibleSchema } from '@hathor/wallet-lib/lib/utils/bigint';
import { createTokenBaseSchema, createNanoContractCreateTokenTxConfirmationResponseSchema } from '../schemas';

const createNanoContractCreateTokenTxSchema = z.object({
  method: z.string().min(1),
  address: z.string().min(1),
  data: z.object({
    blueprint_id: z.string().nullable().optional(),
    nc_id: z.string().nullable().optional(),
    actions: z.array(INanoContractActionSchema).optional(),
    args: z.array(z.unknown()).optional(),
  }).optional(),
  createTokenOptions: createTokenBaseSchema.extend({
    contractPaysTokenDeposit: z.boolean(),
  }).optional(),
  max_fee: bigIntCoercibleSchema.optional(),
  contract_pays_fees: z.boolean().optional(),
  push_tx: z.boolean().default(true),
}).transform(data => ({
  ...data,
  ...(data.max_fee !== undefined && { maxFee: data.max_fee }),
  ...(data.contract_pays_fees !== undefined && { contractPaysFees: data.contract_pays_fees }),
}));

/**
 * Creates and optionally sends a nano contract transaction that creates a new token.
 * This function handles the entire flow including parameter validation, user confirmation,
 * PIN verification, and transaction creation/sending.
 * 
 * @param rpcRequest - The RPC request containing parameters for the nano contract and token creation
 * @param wallet - The Hathor wallet instance to use for transaction creation
 * @param requestMetadata - Metadata about the request for context in prompts
 * @param promptHandler - Handler function for user interaction prompts (confirmation and PIN)
 * 
 * @returns A promise that resolves to a CreateNanoContractCreateTokenTxResponse containing the transaction response
 * 
 * @throws {InvalidParamsError} If the request parameters fail validation
 * @throws {PromptRejectedError} If the user rejects either the confirmation or PIN prompt
 */
export async function createNanoContractCreateTokenTx(
  rpcRequest: CreateNanoContractCreateTokenTxRpcRequest,
  wallet: IHathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
): Promise<CreateNanoContractCreateTokenTxResponse> {
  const validationResult = createNanoContractCreateTokenTxSchema.safeParse(rpcRequest.params);
  if (!validationResult.success) {
    throw new InvalidParamsError(validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
  }
  const { method, address, data, createTokenOptions, maxFee, contractPaysFees, push_tx } = validationResult.data;

  // Only pass CreateTokenParams fields, fallback to null/empty for missing
  // Prepare createTokenOptions for pre-building transaction
  const preBuildTokenOptions = {
    name: createTokenOptions?.name ?? '',
    symbol: createTokenOptions?.symbol ?? '',
    amount: typeof createTokenOptions?.amount === 'string' ? BigInt(createTokenOptions.amount) : (createTokenOptions?.amount ?? 0n),
    version: createTokenOptions?.version ?? null,
    mintAddress: createTokenOptions?.mintAddress ?? address,
    changeAddress: createTokenOptions?.changeAddress ?? null,
    createMint: createTokenOptions?.createMint ?? true,
    mintAuthorityAddress: createTokenOptions?.mintAuthorityAddress ?? null,
    allowExternalMintAuthorityAddress: createTokenOptions?.allowExternalMintAuthorityAddress ?? false,
    createMelt: createTokenOptions?.createMelt ?? true,
    meltAuthorityAddress: createTokenOptions?.meltAuthorityAddress ?? null,
    allowExternalMeltAuthorityAddress: createTokenOptions?.allowExternalMeltAuthorityAddress ?? false,
    data: createTokenOptions?.data ?? null,
    contractPaysTokenDeposit: createTokenOptions?.contractPaysTokenDeposit ?? false,
  };

  // Pre-build transaction without signing to calculate fees
  const preBuildData = {
    blueprintId: data?.blueprint_id ?? null,
    ncId: data?.nc_id ?? null,
    actions: data?.actions ?? [],
    args: data?.args ?? [],
  };

  const preBuildResult = await wallet.createNanoContractCreateTokenTransaction(
    method,
    address,
    preBuildData,
    preBuildTokenOptions,
    {
      maxFee,
      contractPaysFees,
      signTx: false,
    }
  );

  if (!preBuildResult.transaction) {
    throw new SendNanoContractTxError('Unable to create transaction object');
  }

  // Extract fee from pre-built transaction
  const feeHeader = preBuildResult.transaction.getFeeHeader?.();
  if (feeHeader && feeHeader.entries.some(entry => entry.tokenIndex !== 0)) {
    throw new InvalidParamsError('Unexpected fee entry with non-HTR token index');
  }
  // Sum all fee entries for HTR token (index 0)
  const fee = feeHeader
    ? feeHeader.entries.reduce((sum, entry) => sum + entry.amount, 0n)
    : 0n;

  // Prepare nano and token params for the confirmation prompt
  const nanoParams: NanoContractParams = {
    blueprintId: data?.blueprint_id ?? null,
    ncId: data?.nc_id ?? null,
    actions: data?.actions ?? [],
    method,
    args: data?.args ?? [],
    parsedArgs: [],
    pushTx: push_tx,
    fee,
    contractPaysFees: contractPaysFees ?? false,
    preparedTx: preBuildResult.transaction,
  };

  const confirmationPrompt: CreateNanoContractCreateTokenTxConfirmationPrompt = {
    ...rpcRequest,
    type: TriggerTypes.CreateNanoContractCreateTokenTxConfirmationPrompt,
    data: {
      nano: nanoParams,
      token: {
        ...preBuildTokenOptions,
        fee,
      },
    },
  };
  const rawResponse = await promptHandler(confirmationPrompt, requestMetadata);

  // Parse and validate the entire response with Zod
  const responseValidation = createNanoContractCreateTokenTxConfirmationResponseSchema.safeParse(rawResponse);
  if (!responseValidation.success) {
    throw new SendNanoContractTxError(responseValidation.error.errors.map(e => e.message).join(', '));
  }

  const confirmationResponse = responseValidation.data;

  if (!confirmationResponse.data.accepted) {
    throw new PromptRejectedError('User rejected nano contract create token transaction prompt');
  }

  const confirmedCaller = confirmationResponse.data.nano.caller;

  // Prompt for PIN
  const pinPrompt: PinConfirmationPrompt = {
    ...rpcRequest,
    type: TriggerTypes.PinConfirmationPrompt,
  };
  const pinResponse = await promptHandler(pinPrompt, requestMetadata) as PinRequestResponse;
  if (!pinResponse.data.accepted) {
    throw new PromptRejectedError('User rejected PIN prompt');
  }

  // Emit loading trigger
  const loadingTrigger: CreateNanoContractCreateTokenTxLoadingTrigger = {
    type: TriggerTypes.CreateNanoContractCreateTokenTxLoadingTrigger,
  };
  promptHandler(loadingTrigger, requestMetadata);

  // If caller changed, update the pre-built transaction
  if (confirmedCaller !== address) {
    const nanoHeaders = preBuildResult.transaction.getNanoHeaders();
    if (!nanoHeaders || nanoHeaders.length === 0) {
      throw new SendNanoContractTxError('No nano headers found in the transaction');
    }
    await wallet.setNanoHeaderCaller(nanoHeaders[0], confirmedCaller);
  }

  await wallet.signTx(preBuildResult.transaction, { pinCode: pinResponse.data.pinCode });

  // Send or return hex based on push_tx flag
  let response: Transaction | string;
  if (push_tx) {
    // Send the transaction
    response = await preBuildResult.runFromMining();
  } else {
    // Convert to hex format for the response when not pushing to network
    response = preBuildResult.transaction.toHex();
  }

  // Emit loading finished trigger
  const loadingFinishedTrigger: CreateNanoContractCreateTokenTxLoadingFinishedTrigger = {
    type: TriggerTypes.CreateNanoContractCreateTokenTxLoadingFinishedTrigger,
  };
  promptHandler(loadingFinishedTrigger, requestMetadata);

  return {
    type: RpcResponseTypes.CreateNanoContractCreateTokenTxResponse,
    response,
  };
} 
