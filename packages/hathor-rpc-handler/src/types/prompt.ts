/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { AddressInfoObject, GetBalanceObject, TokenDetailsObject } from '@hathor/wallet-lib/lib/wallet/types';
import { TokenVersion } from '@hathor/wallet-lib';
import { NanoContractAction } from '@hathor/wallet-lib/lib/nano_contracts/types';
import type { DataScriptOutputRequestObj, Transaction } from '@hathor/wallet-lib';
import { RequestMetadata, RpcRequest } from './rpcRequest';

export enum TriggerTypes {
  GetBalanceConfirmationPrompt,
  SignMessageWithAddressConfirmationPrompt,
  PinConfirmationPrompt,
  AddressRequestPrompt,
  GenericConfirmationPrompt,
  AddressRequestClientPrompt,
  GetUtxosConfirmationPrompt,
  SendNanoContractTxConfirmationPrompt,
  GenericLoadingTrigger,
  SendNanoContractTxLoadingTrigger,
  SendNanoContractTxErrorTrigger,
  SendNanoContractTxSuccessTrigger,
  SendNanoContractTxLoadingFinishedTrigger,
  CreateTokenLoadingFinishedTrigger,
  LoadingFinishedTrigger,
  CreateTokenConfirmationPrompt,
  CreateTokenLoadingTrigger,
  SignOracleDataConfirmationPrompt,
  SendTransactionConfirmationPrompt,
  SendTransactionLoadingTrigger,
  SendTransactionLoadingFinishedTrigger,
  CreateNanoContractCreateTokenTxConfirmationPrompt,
  CreateNanoContractCreateTokenTxLoadingTrigger,
  CreateNanoContractCreateTokenTxLoadingFinishedTrigger,
  ChangeNetworkConfirmationPrompt,
  GetXpubConfirmationPrompt,
}

export enum TriggerResponseTypes {
  AddressRequestClientResponse,
  AddressRequestConfirmationResponse,
  PinRequestResponse,
  GetUtxosConfirmationResponse,
  SignMessageWithAddressConfirmationResponse,
  SendNanoContractTxConfirmationResponse,
  CreateTokenConfirmationResponse,
  SignOracleDataConfirmationResponse,
  SendTransactionConfirmationResponse,
  CreateNanoContractCreateTokenTxConfirmationResponse,
  GetBalanceConfirmationResponse,
  ChangeNetworkRequestConfirmationResponse,
  GetXpubConfirmationResponse,
}

export type Trigger =
  GetAddressConfirmationPrompt
  | AddressRequestClientPrompt
  | GetBalanceConfirmationPrompt
  | GetUtxosConfirmationPrompt
  | PinConfirmationPrompt
  | AddressRequestPrompt
  | GenericConfirmationPrompt
  | SignMessageWithAddressConfirmationPrompt
  | SendNanoContractTxConfirmationPrompt
  | SendNanoContractTxLoadingTrigger
  | SendNanoContractTxLoadingFinishedTrigger
  | SendNanoContractTxSuccessTrigger
  | SendNanoContractTxErrorTrigger
  | LoadingFinishedTrigger
  | CreateTokenConfirmationPrompt
  | CreateTokenLoadingTrigger
  | CreateTokenLoadingFinishedTrigger
  | SignOracleDataConfirmationPrompt
  | SendTransactionConfirmationPrompt
  | SendTransactionLoadingTrigger
  | SendTransactionLoadingFinishedTrigger
  | CreateNanoContractCreateTokenTxConfirmationPrompt
  | CreateNanoContractCreateTokenTxLoadingTrigger
  | CreateNanoContractCreateTokenTxLoadingFinishedTrigger
  | ChangeNetworkConfirmationPrompt
  | GetXpubConfirmationPrompt;

export interface BaseLoadingTrigger {
  type: TriggerTypes;
}

export interface SendNanoContractTxLoadingTrigger {
  type: TriggerTypes.SendNanoContractTxLoadingTrigger;
}

export interface SendNanoContractTxErrorTrigger {
  type: TriggerTypes.SendNanoContractTxErrorTrigger;
}

export interface SendNanoContractTxSuccessTrigger {
  type: TriggerTypes.SendNanoContractTxSuccessTrigger;
}

export interface CreateTokenLoadingTrigger {
  type: TriggerTypes.CreateTokenLoadingTrigger;
}

export interface SendNanoContractTxLoadingFinishedTrigger {
  type: TriggerTypes.SendNanoContractTxLoadingFinishedTrigger;
}

export interface CreateTokenLoadingFinishedTrigger {
  type: TriggerTypes.CreateTokenLoadingFinishedTrigger;
}

export interface LoadingFinishedTrigger {
  type: TriggerTypes.LoadingFinishedTrigger;
}

export type BaseConfirmationPrompt = RpcRequest & {
  type: TriggerTypes;
}

export type GetAddressConfirmationPrompt = BaseConfirmationPrompt & {
  data: {
    address: string;
  }
}

export type ChangeNetworkConfirmationPrompt = BaseConfirmationPrompt & {
  type: TriggerTypes.ChangeNetworkConfirmationPrompt;
  data: {
    newNetwork: string;
  }
}

export type GetXpubConfirmationPrompt = BaseConfirmationPrompt & {
  type: TriggerTypes.GetXpubConfirmationPrompt;
  data: {
    xpub: string;
  }
}

export type GetBalanceConfirmationPrompt = BaseConfirmationPrompt & {
  type: TriggerTypes.GetBalanceConfirmationPrompt;
  data: GetBalanceObject[];
}

export type GetUtxosConfirmationPrompt = BaseConfirmationPrompt & {
  type: TriggerTypes.GetUtxosConfirmationPrompt;
  data: UtxoDetails;
}

export type SignOracleDataConfirmationPrompt = BaseConfirmationPrompt & {
  type: TriggerTypes.SignOracleDataConfirmationPrompt;
  data: {
    oracle: string;
    data: string;
  }
}

export type SignMessageWithAddressConfirmationPrompt = BaseConfirmationPrompt & {
  type: TriggerTypes.SignMessageWithAddressConfirmationPrompt;
  data: {
    address: AddressInfoObject;
    message: string;
  }
}

export type PinConfirmationPrompt = BaseConfirmationPrompt & {
  type: TriggerTypes.PinConfirmationPrompt;
}

export type AddressRequestPrompt = BaseConfirmationPrompt & {
  type: TriggerTypes.AddressRequestPrompt;
  data: AddressInfoObject;
}

export type AddressRequestClientPrompt = BaseConfirmationPrompt & {
  type: TriggerTypes.AddressRequestClientPrompt;
}

export interface NanoContractParams {
  blueprintId: string | null;
  ncId: string | null;
  actions: NanoContractAction[],
  method: string;
  args: unknown[];
  parsedArgs: unknown[];
  pushTx: boolean;
  tokenDetails?: Map<string, TokenDetailsObject>;
  /**
   * Calculated network fee for the transaction.
   * This is calculated based on the token outputs and their versions.
   */
  networkFee?: bigint;
}

export interface CreateTokenParams {
  name: string,
  symbol: string,
  amount: bigint,
  address?: string | null,
  mintAddress?: string | null,
  changeAddress: string | null,
  createMint: boolean,
  mintAuthorityAddress: string | null,
  allowExternalMintAuthorityAddress: boolean,
  createMelt: boolean,
  meltAuthorityAddress: string | null,
  allowExternalMeltAuthorityAddress: boolean,
  data: string[] | null,
  /**
   * Token version for the new token.
   * If not provided, the wallet-lib will use the default (NATIVE).
   */
  tokenVersion?: TokenVersion,
  /**
   * Calculated network fee for the token creation.
   * This is only applicable for fee tokens (TokenVersion.FEE).
   */
  networkFee?: bigint,
  /**
   * Calculated deposit amount for the token creation.
   * This is only applicable for deposit tokens (TokenVersion.DEPOSIT).
   */
  depositAmount?: bigint,
}

// Extended type for nano contract token creation
export interface NanoContractCreateTokenParams extends CreateTokenParams {
  contractPaysTokenDeposit: boolean;
}

export type CreateTokenConfirmationPrompt = BaseConfirmationPrompt & {
  type: TriggerTypes.CreateTokenConfirmationPrompt;
  data: CreateTokenParams;
}

export type SendNanoContractTxConfirmationPrompt = BaseConfirmationPrompt & {
  type: TriggerTypes.SendNanoContractTxConfirmationPrompt;
  data: NanoContractParams;
}

export type GenericConfirmationPrompt = BaseConfirmationPrompt & {
  type: TriggerTypes.GenericConfirmationPrompt;
  data: unknown;
}

export interface AddressRequestClientResponse {
  type: TriggerResponseTypes.AddressRequestClientResponse;
  data: {
    address: string;
  }
}

export interface SendNanoContractTxConfirmationResponse {
  type: TriggerResponseTypes.SendNanoContractTxConfirmationResponse;
  data: {
    accepted: true;
    nc: NanoContractParams & {
      caller: string;
    }
  } | {
    accepted: false;
  }
}

export interface CreateTokenConfirmationResponse {
  type: TriggerResponseTypes.CreateTokenConfirmationResponse;
  data: {
    accepted: true;
    token: CreateTokenParams;
  } | {
    accepted: false;
  }
}

export interface PinRequestResponse {
  type: TriggerResponseTypes.PinRequestResponse;
  data: {
    accepted: true;
    pinCode: string;
  } | {
    accepted: false;
  }
}

export interface AddressRequestConfirmationResponse {
  type: TriggerResponseTypes.AddressRequestConfirmationResponse;
  data: boolean;
}

export interface ChangeNetworkRequestConfirmationResponse {
  type: TriggerResponseTypes.ChangeNetworkRequestConfirmationResponse;
  data: boolean;
}

export interface GetXpubConfirmationResponse {
  type: TriggerResponseTypes.GetXpubConfirmationResponse;
  data: boolean;
}

export interface GetBalanceConfirmationResponse {
  type: TriggerResponseTypes.GetBalanceConfirmationResponse;
  data: boolean;
}

export interface GetUtxosConfirmationResponse {
  type: TriggerResponseTypes.GetUtxosConfirmationResponse;
  data: boolean;
}

export interface SignMessageWithAddressConfirmationResponse {
  type: TriggerResponseTypes.SignMessageWithAddressConfirmationResponse;
  data: boolean;
}

export interface SignOracleDataConfirmationResponse {
  type: TriggerResponseTypes.SignOracleDataConfirmationResponse;
  data: boolean;
}

export interface SendTransactionOutputParam {
  address: string;
  value: bigint;
  token: string;
  timelock?: number;
}

export interface SendTransactionInputParam {
  txId: string;
  index: number;
}

export type SendTransactionConfirmationPrompt = BaseConfirmationPrompt & {
  type: TriggerTypes.SendTransactionConfirmationPrompt;
  data: {
    outputs: (SendTransactionOutputParam | DataScriptOutputRequestObj)[];
    inputs?: SendTransactionInputParam[];
    changeAddress?: string;
    pushTx: boolean;
    tokenDetails?: Map<string, TokenDetailsObject>;
    /**
     * Calculated network fee for the transaction.
     * This is calculated based on the token outputs and their versions.
     */
    networkFee?: bigint;
    /**
     * The full prepared Transaction object before signing.
     * Available for clients that need access to the complete transaction details
     * (e.g. inputs with scripts, outputs with token indexes, etc.).
     */
    preparedTx: Transaction;
  }
}

export interface SendTransactionConfirmationResponse {
  type: TriggerResponseTypes.SendTransactionConfirmationResponse;
  data: {
    accepted: boolean;
  }
}

export interface CreateNanoContractCreateTokenTxParams {
  nano: NanoContractParams;
  token: NanoContractCreateTokenParams;
}

export type CreateNanoContractCreateTokenTxConfirmationPrompt = BaseConfirmationPrompt & {
  type: TriggerTypes.CreateNanoContractCreateTokenTxConfirmationPrompt;
  data: CreateNanoContractCreateTokenTxParams;
}

export interface CreateNanoContractCreateTokenTxConfirmationResponse {
  type: TriggerResponseTypes.CreateNanoContractCreateTokenTxConfirmationResponse;
  data: {
    accepted: true;
    nano: NanoContractParams & { caller: string };
    token: NanoContractCreateTokenParams;
  } | {
    accepted: false;
  }
}

export type TriggerResponse =
  AddressRequestClientResponse
  | AddressRequestConfirmationResponse
  | GetUtxosConfirmationResponse
  | PinRequestResponse
  | SignMessageWithAddressConfirmationResponse
  | SendNanoContractTxConfirmationResponse
  | CreateTokenConfirmationResponse
  | SignOracleDataConfirmationResponse
  | SendTransactionConfirmationResponse
  | CreateNanoContractCreateTokenTxConfirmationResponse
  | GetBalanceConfirmationResponse
  | ChangeNetworkRequestConfirmationResponse
  | GetXpubConfirmationResponse;

export type TriggerHandler = (prompt: Trigger, requestMetadata: RequestMetadata) => Promise<TriggerResponse | void>;

// TODO: These should come from the lib after we implement the method to
// be common for both facades.
export interface UtxoInfo {
  address: string;
  amount: bigint;
  tx_id: string;
  locked: boolean;
  index: number;
}

export interface UtxoDetails {
  total_amount_available: bigint;
  total_utxos_available: bigint;
  total_amount_locked: bigint;
  total_utxos_locked: bigint;
  utxos: UtxoInfo[];
}

export interface SendTransactionLoadingTrigger extends BaseLoadingTrigger {
  type: TriggerTypes.SendTransactionLoadingTrigger;
}

export interface SendTransactionLoadingFinishedTrigger extends BaseLoadingTrigger {
  type: TriggerTypes.SendTransactionLoadingFinishedTrigger;
}

export interface CreateNanoContractCreateTokenTxLoadingTrigger extends BaseLoadingTrigger {
  type: TriggerTypes.CreateNanoContractCreateTokenTxLoadingTrigger;
}

export interface CreateNanoContractCreateTokenTxLoadingFinishedTrigger extends BaseLoadingTrigger {
  type: TriggerTypes.CreateNanoContractCreateTokenTxLoadingFinishedTrigger;
}
