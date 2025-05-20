import { z } from 'zod';
import type { HathorWallet } from '@hathor/wallet-lib';
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
  NanoContractParams,
  CreateTokenParams,
} from '../types';
import { PromptRejectedError, InvalidParamsError } from '../errors';
import { NanoContractActionType } from '@hathor/wallet-lib/lib/nano_contracts/types';

const NanoContractActionSchema = z.object({
  type: z.nativeEnum(NanoContractActionType),
  token: z.string(),
  amount: z.string().regex(/^[0-9]+$/).pipe(z.coerce.bigint().positive()),
  address: z.string().nullish().default(null),
  changeAddress: z.string().nullish().default(null),
});

const createNanoContractCreateTokenTxSchema = z.object({
  method: z.string().min(1),
  address: z.string().min(1),
  data: z.object({
    blueprintId: z.string().nullable().optional(),
    ncId: z.string().nullable().optional(),
    actions: z.array(NanoContractActionSchema).optional(),
    args: z.array(z.unknown()).optional(),
  }).optional(),
  createTokenOptions: z.object({
    name: z.string(),
    symbol: z.string(),
    amount: z.union([z.string(), z.bigint()]),
    address: z.string().nullable().optional(),
    changeAddress: z.string().nullable().optional(),
    createMint: z.boolean().optional(),
    mintAuthorityAddress: z.string().nullable().optional(),
    allowExternalMintAuthorityAddress: z.boolean().optional(),
    createMelt: z.boolean().optional(),
    meltAuthorityAddress: z.string().nullable().optional(),
    allowExternalMeltAuthorityAddress: z.boolean().optional(),
    data: z.array(z.string()).nullable().optional(),
  }).optional(),
  options: z.unknown().optional(),
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
  wallet: HathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
): Promise<CreateNanoContractCreateTokenTxResponse> {
  const validationResult = createNanoContractCreateTokenTxSchema.safeParse(rpcRequest.params);
  if (!validationResult.success) {
    throw new InvalidParamsError(validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
  }
  const { method, address, data, createTokenOptions, options, push_tx } = validationResult.data;

  // Prepare nano and token params for the confirmation prompt
  const nanoParams: NanoContractParams = {
    blueprintId: data?.blueprintId ?? null,
    ncId: data?.ncId ?? null,
    actions: data?.actions ?? [],
    method,
    args: data?.args ?? [],
    pushTx: push_tx,
  };
  // Only pass CreateTokenParams fields, fallback to null/empty for missing
  const tokenParams: CreateTokenParams = {
    name: createTokenOptions?.name ?? '',
    symbol: createTokenOptions?.symbol ?? '',
    amount: typeof createTokenOptions?.amount === 'string' ? BigInt(createTokenOptions.amount) : (createTokenOptions?.amount ?? 0n),
    address: createTokenOptions?.address ?? null,
    changeAddress: createTokenOptions?.changeAddress ?? null,
    createMint: createTokenOptions?.createMint ?? true,
    mintAuthorityAddress: createTokenOptions?.mintAuthorityAddress ?? null,
    allowExternalMintAuthorityAddress: createTokenOptions?.allowExternalMintAuthorityAddress ?? false,
    createMelt: createTokenOptions?.createMelt ?? true,
    meltAuthorityAddress: createTokenOptions?.meltAuthorityAddress ?? null,
    allowExternalMeltAuthorityAddress: createTokenOptions?.allowExternalMeltAuthorityAddress ?? false,
    data: createTokenOptions?.data ?? null,
  };

  const confirmationPrompt: CreateNanoContractCreateTokenTxConfirmationPrompt = {
    type: TriggerTypes.CreateNanoContractCreateTokenTxConfirmationPrompt,
    method: rpcRequest.method,
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

  // Prompt for PIN
  const pinPrompt: PinConfirmationPrompt = {
    type: TriggerTypes.PinConfirmationPrompt,
    method: rpcRequest.method,
  };
  const pinResponse = await promptHandler(pinPrompt, requestMetadata) as PinRequestResponse;
  if (!pinResponse.data.accepted) {
    throw new PromptRejectedError('User rejected PIN prompt');
  }

  // Ensure options is always an object
  const optionsObj = options && typeof options === 'object' ? options : {};

  // Call the wallet method
  let response;
  if (push_tx) {
    response = await wallet.createAndSendNanoContractCreateTokenTransaction(
      nano.method,
      address,
      nano,
      token,
      { ...optionsObj, pinCode: pinResponse.data.pinCode }
    );
  } else {
    response = await wallet.createNanoContractCreateTokenTransaction(
      nano.method,
      address,
      nano,
      token,
      { ...optionsObj, pinCode: pinResponse.data.pinCode }
    );
  }

  return {
    type: RpcResponseTypes.CreateNanoContractCreateTokenTxResponse,
    response,
  };
} 
