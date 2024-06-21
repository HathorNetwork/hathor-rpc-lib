/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { AddressInfoObject, GetBalanceObject } from '@hathor/wallet-lib/lib/wallet/types';
import { PreparedInput } from '../helpers/transactions';
import { SendTxOutput } from './rpcRequest';

export enum ConfirmationPromptTypes {
  GetBalanceConfirmationPrompt,
  SignMessageWithAddressConfirmationPrompt,
  PinConfirmationPrompt,
  AddressRequestPrompt,
  GenericConfirmationPrompt,
  AddressRequestClientPrompt,
  GetUtxosConfirmationPrompt,
  SendTxConfirmationPrompt,
}

export enum ConfirmationResponseTypes {
  AddressRequestClientResponse,
  PinRequestResponse,
  SendTxConfirmationResponse,
  GetUtxosConfirmationResponse,
  SignMessageWithAddressConfirmationResponse,
}

export interface BaseConfirmationPrompt {
  method: string;
}

export interface GetAddressConfirmationPrompt extends BaseConfirmationPrompt {
  data: {
    address: string;
  }
}

export interface GetBalanceConfirmationPrompt extends BaseConfirmationPrompt {
  type: ConfirmationPromptTypes.GetBalanceConfirmationPrompt;
  data: GetBalanceObject[];
}

export interface GetUtxosConfirmationPrompt extends BaseConfirmationPrompt {
  type: ConfirmationPromptTypes.GetUtxosConfirmationPrompt;
  data: UtxoDetails[];
}

export interface SignMessageWithAddressConfirmationPrompt extends BaseConfirmationPrompt {
  type: ConfirmationPromptTypes.SignMessageWithAddressConfirmationPrompt;
  data: {
    address: AddressInfoObject;
    message: string;
  }
}

export interface PinConfirmationPrompt extends BaseConfirmationPrompt {
  type: ConfirmationPromptTypes.PinConfirmationPrompt;
}

export interface AddressRequestPrompt extends BaseConfirmationPrompt {
  type: ConfirmationPromptTypes.AddressRequestPrompt;
  data?: {
    address: string;
  }
}

export interface AddressRequestClientPrompt extends BaseConfirmationPrompt {
  type: ConfirmationPromptTypes.AddressRequestClientPrompt;
}

export interface SendTxConfirmationPrompt extends BaseConfirmationPrompt {
  type: ConfirmationPromptTypes.SendTxConfirmationPrompt;
  data: {
    inputs: PreparedInput[],
    outputs: SendTxOutput[],
  }
}

export interface GenericConfirmationPrompt extends BaseConfirmationPrompt {
  type: ConfirmationPromptTypes.GenericConfirmationPrompt;
  data: unknown;
}

export type ConfirmationPrompt =
  GetAddressConfirmationPrompt
  | AddressRequestClientPrompt
  | GetBalanceConfirmationPrompt
  | GetUtxosConfirmationPrompt
  | PinConfirmationPrompt
  | AddressRequestPrompt
  | GenericConfirmationPrompt
  | SendTxConfirmationPrompt
  | SignMessageWithAddressConfirmationPrompt;

export interface AddressRequestClientResponse {
  type: ConfirmationResponseTypes.AddressRequestClientResponse;
  data: {
    address: string;
  }
}

export interface PinRequestResponse {
  type: ConfirmationResponseTypes.PinRequestResponse;
  data: {
    accepted: true;
    pinCode: string;
  } | {
    accepted: false;
  }
}

export interface SendTxConfirmationResponse {
  type: ConfirmationResponseTypes.SendTxConfirmationResponse;
  data: boolean;
}

export interface GetUtxosConfirmationResponse {
  type: ConfirmationResponseTypes.GetUtxosConfirmationResponse;
  data: boolean;
}

export interface SignMessageWithAddressConfirmationResponse {
  type: ConfirmationResponseTypes.SignMessageWithAddressConfirmationResponse;
  data: boolean;
}

export type ConfirmationResponse =
  AddressRequestClientResponse
  | SendTxConfirmationResponse
  | GetUtxosConfirmationResponse
  | PinRequestResponse
  | SignMessageWithAddressConfirmationResponse;

export type PromptHandler = (prompt: ConfirmationPrompt) => Promise<ConfirmationResponse>;

// TODO: These should come from the lib after we implement the method to
// be common for both facades.
export interface UtxoInfo {
  address: string;
  amount: number;
  tx_id: string;
  locked: boolean;
  index: number;
}

export interface UtxoDetails {
  total_amount_available: number;
  total_utxos_available: number;
  total_amount_locked: number;
  total_utxos_locked: number;
  utxos: UtxoInfo[];
}
