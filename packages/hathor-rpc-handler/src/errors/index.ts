/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class PromptRejectedError extends Error {};

export class SendNanoContractTxError extends Error {};

export class CreateTokenError extends Error {};

export class InvalidRpcMethod extends Error {};

export class NotImplementedError extends Error {};

export class DifferentNetworkError extends Error {};

export class NoUtxosAvailableError extends Error {};

export class SignMessageError extends Error {};

export class InsufficientFundsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientFundsError';
  }
}

export class InvalidParamsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidParamsError';
  }
}

export class MissingParamError extends Error {
  constructor(paramName: string) {
    super(`Missing required parameter: ${paramName}`);
    this.name = 'MissingParamError';
  }
}

export class InvalidParamTypeError extends Error {
  constructor(paramName: string, expectedType: string) {
    super(`Invalid parameter type for ${paramName}. Expected ${expectedType}`);
    this.name = 'InvalidParamTypeError';
  }
}

export class SendTransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SendTransactionError';
  }
}
