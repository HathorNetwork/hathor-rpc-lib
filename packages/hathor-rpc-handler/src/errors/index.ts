/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class PromptRejectedError extends Error {};

export class SendNanoContractTxFailure extends Error {};

export class InvalidRpcMethod extends Error {};

export class NotImplementedError extends Error {};

export class DifferentNetworkError extends Error {};

export class NoUtxosAvailableError extends Error {};

export class SignMessageFailure extends Error {};
