/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { GetBalanceObject } from '@hathor/wallet-lib/lib/wallet/types';

export enum ConfirmationPromptTypes {
  GetBalanceConfirmationPrompt,
  SignMessageWithAddress,
  PinConfirmationPrompt,
  AddressRequestPrompt,
  GenericConfirmationPrompt,
  AddressRequestClientPrompt,
  GetUtxosConfirmationPrompt,
}

export enum ConfirmationResponseTypes {
  AddressRequestClientResponse,
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
  data: GetBalanceObject[];
}

export interface SignMessageWithAddressConfirmationPrompt extends BaseConfirmationPrompt {
  type: ConfirmationPromptTypes.SignMessageWithAddress;
  data: {
    address: string;
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
  | SignMessageWithAddressConfirmationPrompt;

export interface AddressRequestClientResponse {
  type: ConfirmationResponseTypes.AddressRequestClientResponse;
  data: {
    address: string;
  }
}

export type ConfirmationResponse =
  AddressRequestClientResponse;

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
