/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { GetBalanceObject } from '@hathor/wallet-lib/lib/wallet/types';

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

export interface GetAddressConfirmationPrompt {
  method: 'htr_getAddress';
  data: {
    address: string;
  }
}

export interface GetBalanceConfirmationPrompt {
  method: 'htr_getBalance';
  data: GetBalanceObject[];
}

export interface GetUtxosConfirmationPrompt {
  method: 'htr_getUtxos';
  data: GetBalanceObject[];
}

export interface SignMessageWithAddressConfirmationPrompt {
  method: 'htr_signWithAddress';
  data: {
    address: string;
    message: string;
  }
}

export interface PinConfirmationPrompt {
  method: string;
}

export interface AddressRequestPrompt {
  method: string;
}

export interface GenericConfirmationPrompt {
  method: string;
  data: unknown;
}

export type ConfirmationPrompt =
  GetAddressConfirmationPrompt
  | GetBalanceConfirmationPrompt
  | GetUtxosConfirmationPrompt
  | PinConfirmationPrompt
  | AddressRequestPrompt
  | GenericConfirmationPrompt;

export type PromptResult = {
  type: 'CONFIRMATION';
  result: boolean;
} | {
  type: 'INPUT';
  result: string;
}

export type PromptHandler = (prompt: ConfirmationPrompt) => Promise<PromptResult>;
