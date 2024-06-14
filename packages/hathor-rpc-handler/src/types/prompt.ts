/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type ConfirmationPrompt = {
  method: 'get_address';
  data: {
    address: string;
  }
} | {
  method: 'getBalance';
  data: {
    available: number;
    locked: number;
  }
} | {
  method: string;
  data: unknown;
};

export type PromptResult = {
  type: 'CONFIRMATION';
  result: boolean;
} | {
  type: 'INPUT';
  result: string;
}

export type PromptHandler = (prompt: ConfirmationPrompt) => Promise<PromptResult>;
