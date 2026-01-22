/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';
import type { IHathorWallet, Transaction } from '@hathor/wallet-lib';
import type { CreateTokenOptionsInput } from '@hathor/wallet-lib/lib/wallet/types';
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
  CreateNanoContractCreateTokenTxConfirmationResponse,
  CreateNanoContractCreateTokenTxLoadingTrigger,
  CreateNanoContractCreateTokenTxLoadingFinishedTrigger,
  NanoContractParams,
  CreateTokenParams,
} from '../types';
import { PromptRejectedError, InvalidParamsError } from '../errors';
import { INanoContractActionSchema } from '@hathor/wallet-lib';
import { createTokenBaseSchema } from '../schemas';

// Extend CreateTokenParams to include nano contract specific fields
type NanoContractCreateTokenParams = CreateTokenParams & {
  contractPaysTokenDeposit: boolean;
};

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
  push_tx: z.boolean().default(true),
});

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
  const { method, address, data, createTokenOptions, push_tx } = validationResult.data;

  // Prepare nano and token params for the confirmation prompt
  const nanoParams: NanoContractParams = {
    blueprintId: data?.blueprint_id ?? null,
    ncId: data?.nc_id ?? null,
    actions: data?.actions ?? [],
    method,
    args: data?.args ?? [],
    parsedArgs: [],
    pushTx: push_tx,
  };
  // Only pass CreateTokenParams fields, fallback to null/empty for missing
  const tokenParams: NanoContractCreateTokenParams = {
    name: createTokenOptions?.name ?? '',
    symbol: createTokenOptions?.symbol ?? '',
    amount: typeof createTokenOptions?.amount === 'string' ? BigInt(createTokenOptions.amount) : (createTokenOptions?.amount ?? 0n),
    mintAddress: createTokenOptions?.mintAddress ?? null,
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

  const confirmationPrompt: CreateNanoContractCreateTokenTxConfirmationPrompt = {
    ...rpcRequest,
    type: TriggerTypes.CreateNanoContractCreateTokenTxConfirmationPrompt,
    data: {
      nano: nanoParams,
      token: tokenParams,
    },
  };
  const confirmationResponse = await promptHandler(
    confirmationPrompt, requestMetadata,
  ) as CreateNanoContractCreateTokenTxConfirmationResponse;
  if (!confirmationResponse.data.accepted) {
    throw new PromptRejectedError('User rejected nano contract create token transaction prompt');
  }

  const { nano, token } = confirmationResponse.data;

  // Ensure required fields have values and cast to CreateTokenOptionsInput
  const tokenOptions: CreateTokenOptionsInput = {
    name: token.name,
    symbol: token.symbol,
    amount: token.amount,
    mintAddress: token.mintAddress ?? address, // Use the address param as default mintAddress
    contractPaysTokenDeposit: token.contractPaysTokenDeposit ?? false,
    changeAddress: token.changeAddress,
    createMint: token.createMint,
    mintAuthorityAddress: token.mintAuthorityAddress,
    allowExternalMintAuthorityAddress: token.allowExternalMintAuthorityAddress,
    createMelt: token.createMelt,
    meltAuthorityAddress: token.meltAuthorityAddress,
    allowExternalMeltAuthorityAddress: token.allowExternalMeltAuthorityAddress,
    data: token.data,
  };

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

  // Call the wallet method
  let response: Transaction | string;
  if (push_tx) {
    response = await wallet.createAndSendNanoContractCreateTokenTransaction(
      nano.method,
      address,
      nano,
      tokenOptions,
      { pinCode: pinResponse.data.pinCode }
    );
  } else {
    const sendTransactionObj = await wallet.createNanoContractCreateTokenTransaction(
      nano.method,
      address,
      nano,
      tokenOptions,
      { pinCode: pinResponse.data.pinCode }
    );
    // Convert to hex format for the response when not pushing to network
    if (!sendTransactionObj.transaction) {
      throw new Error('Failed to create transaction');
    }
    response = sendTransactionObj.transaction.toHex();
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
