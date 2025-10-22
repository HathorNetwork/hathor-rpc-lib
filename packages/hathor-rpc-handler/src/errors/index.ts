/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Base error class for all Hathor RPC errors.
 * Sets the data property with errorType based on the error name.
 */
export class HathorBaseError extends Error {
  public readonly data: { errorType: string };

  constructor(message: string, errorType: string) {
    super(message);
    this.name = errorType;
    this.data = { errorType };
  }
}

export class PromptRejectedError extends HathorBaseError {
  constructor(message: string | undefined | null = null) {
    super(message ?? 'User rejected prompt', 'PromptRejectedError');
  }
}

export class SendNanoContractTxError extends HathorBaseError {
  constructor(message?: string) {
    super(message ?? 'Send nano contract transaction error', 'SendNanoContractTxError');
  }
}

export class CreateTokenError extends HathorBaseError {
  constructor(message?: string) {
    super(message ?? 'Create token error', 'CreateTokenError');
  }
}

export class InvalidRpcMethod extends HathorBaseError {
  constructor(message?: string) {
    super(message ?? 'Invalid RPC method', 'InvalidRpcMethod');
  }
}

export class NotImplementedError extends HathorBaseError {
  constructor(message?: string) {
    super(message ?? 'Not implemented', 'NotImplementedError');
  }
}

export class DifferentNetworkError extends HathorBaseError {
  constructor(message?: string) {
    super(message ?? 'Different network error', 'DifferentNetworkError');
  }
}

export class NoUtxosAvailableError extends HathorBaseError {
  constructor(message?: string) {
    super(message ?? 'No UTXOs available', 'NoUtxosAvailableError');
  }
}

export class SignMessageError extends HathorBaseError {
  constructor(message?: string) {
    super(message ?? 'Sign message error', 'SignMessageError');
  }
}

export class InsufficientFundsError extends HathorBaseError {
  constructor(message: string) {
    super(message, 'InsufficientFundsError');
  }
}

export class InvalidParamsError extends HathorBaseError {
  constructor(message: string) {
    super(message, 'InvalidParamsError');
  }
}

export class MissingParamError extends HathorBaseError {
  constructor(paramName: string) {
    super(`Missing required parameter: ${paramName}`, 'MissingParamError');
  }
}

export class InvalidParamTypeError extends HathorBaseError {
  constructor(paramName: string, expectedType: string) {
    super(`Invalid parameter type for ${paramName}. Expected ${expectedType}`, 'InvalidParamTypeError');
  }
}

export class PrepareSendTransactionError extends HathorBaseError {
  constructor(message: string) {
    super(message, 'PrepareSendTransactionError');
  }
}

export class SendTransactionError extends HathorBaseError {
  constructor(message: string) {
    super(message, 'SendTransactionError');
  }
}

export class WalletXpubNotAvailableError extends HathorBaseError {
  constructor() {
    super('Wallet xpub is not available', 'WalletXpubNotAvailableError');
  }
}
