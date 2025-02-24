/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet, Transaction } from '@hathor/wallet-lib';
import {
  CreateTokenConfirmationPrompt,
  CreateTokenConfirmationResponse,
  CreateTokenLoadingFinishedTrigger,
  CreateTokenLoadingTrigger,
  CreateTokenRpcRequest,
  PinConfirmationPrompt,
  PinRequestResponse,
  RequestMetadata,
  RpcResponse,
  RpcResponseTypes,
  TriggerHandler,
  TriggerTypes,
} from '../types';
import { CreateTokenError, PromptRejectedError, InvalidParamsError } from '../errors';
import { z } from 'zod';

const createTokenSchema = z.object({
  name: z.string().min(1),
  symbol: z.string().min(1),
  amount: z.number().positive(),
  address: z.string().nullish().default(null),
  change_address: z.string().nullish().default(null).transform(val => val),
  create_mint: z.boolean().default(true).transform(val => val),
  mint_authority_address: z.string().nullish().default(null).transform(val => val),
  allow_external_mint_authority_address: z.boolean().optional().default(false).transform(val => val),
  create_melt: z.boolean().default(true).transform(val => val),
  melt_authority_address: z.string().nullish().default(null).transform(val => val),
  allow_external_melt_authority_address: z.boolean().optional().default(false).transform(val => val),
  data: z.string().array().nullish().default(null),
}).transform(data => ({
  ...data,
  changeAddress: data.change_address,
  createMint: data.create_mint,
  mintAuthorityAddress: data.mint_authority_address,
  allowExternalMintAuthorityAddress: data.allow_external_mint_authority_address,
  createMelt: data.create_melt,
  meltAuthorityAddress: data.melt_authority_address,
  allowExternalMeltAuthorityAddress: data.allow_external_melt_authority_address,
}));

/**
 * Handles the creation of a new token on the Hathor blockchain.
 *
 * This function orchestrates the entire token creation process, including
 * validating addresses, prompting for user confirmation and PIN code, and 
 * interacting with the wallet library to create the token. It supports 
 * optional parameters for mint and melt authorities, and allows for 
 * customization of the token creation process.
 *
 * @param {CreateTokenRpcRequest} rpcRequest - The RPC request object containing the token details, including
 *   the token name, symbol, amount, and various options related to minting and melting.
 * @param wallet - The wallet instance that will be used to create the token.
 * @param requestMetadata - Metadata associated with the request, such as the request ID 
 *   and other contextual information.
 * @param triggerHandler - A function that handles triggering user prompts, such as
 *   confirmations and PIN entry.
 *
 * @returns An object containing transaction details of the created token.
 */
export async function createToken(
  rpcRequest: CreateTokenRpcRequest,
  wallet: HathorWallet,
  requestMetadata: RequestMetadata,
  triggerHandler: TriggerHandler,
) {
  try {
    const params = createTokenSchema.parse(rpcRequest.params);
    
    if (params.changeAddress && !await wallet.isAddressMine(params.changeAddress)) {
      throw new Error('Change address is not from this wallet');
    }

    const pinPrompt: PinConfirmationPrompt = {
      type: TriggerTypes.PinConfirmationPrompt,
      method: rpcRequest.method,
    };

    const createTokenPrompt: CreateTokenConfirmationPrompt = {
      type: TriggerTypes.CreateTokenConfirmationPrompt,
      method: rpcRequest.method,
      data: {
        name: params.name,
        symbol: params.symbol,
        amount: params.amount,
        address: params.address,
        changeAddress: params.changeAddress,
        createMint: params.createMint,
        mintAuthorityAddress: params.mintAuthorityAddress,
        allowExternalMintAuthorityAddress: params.allowExternalMintAuthorityAddress,
        createMelt: params.createMelt,
        meltAuthorityAddress: params.meltAuthorityAddress,
        allowExternalMeltAuthorityAddress: params.allowExternalMeltAuthorityAddress,
        data: params.data,
      },
    };

    const createTokeResponse = await triggerHandler(createTokenPrompt, requestMetadata) as CreateTokenConfirmationResponse;

    if (!createTokeResponse.data.accepted) {
      throw new PromptRejectedError();
    }

    const pinCodeResponse: PinRequestResponse = (await triggerHandler(pinPrompt, requestMetadata)) as PinRequestResponse;

    if (!pinCodeResponse.data.accepted) {
      throw new PromptRejectedError('Pin prompt rejected');
    }

    try {
      const createTokenLoadingTrigger: CreateTokenLoadingTrigger = {
        type: TriggerTypes.CreateTokenLoadingTrigger,
      };

      // No need to await as this is a fire-and-forget trigger
      triggerHandler(createTokenLoadingTrigger, requestMetadata);

      const response: Transaction = await wallet.createNewToken(
        params.name,
        params.symbol,
        params.amount,
        {
          changeAddress: params.changeAddress,
          address: params.address,
          createMint: params.createMint,
          mintAuthorityAddress: params.mintAuthorityAddress,
          allowExternalMintAuthorityAddress: params.allowExternalMintAuthorityAddress,
          createMelt: params.createMelt,
          meltAuthorityAddress: params.meltAuthorityAddress,
          allowExternalMeltAuthorityAddress: params.allowExternalMeltAuthorityAddress,
          data: params.data,
          pinCode: pinCodeResponse.data.pinCode,
        }
      );

      const createTokenLoadingFinished: CreateTokenLoadingFinishedTrigger = {
        type: TriggerTypes.CreateTokenLoadingFinishedTrigger,
      };
      triggerHandler(createTokenLoadingFinished, requestMetadata);

      return {
        type: RpcResponseTypes.CreateTokenResponse,
        response,
      } as RpcResponse;

    } catch (err) {
      if (err instanceof Error) {
        throw new CreateTokenError(err.message);
      } else {
        throw new CreateTokenError('An unknown error occurred');
      }
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new InvalidParamsError(err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    throw err;
  }
}
