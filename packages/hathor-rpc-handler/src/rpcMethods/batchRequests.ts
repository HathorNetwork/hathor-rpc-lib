/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';
import { config, Network, ncApi, nanoUtils } from '@hathor/wallet-lib';
import type { IHathorWallet } from '@hathor/wallet-lib';
import type { AddressInfoObject } from '@hathor/wallet-lib/lib/wallet/types';
import {
  TriggerTypes,
  TriggerHandler,
  RequestMetadata,
  RpcResponse,
  RpcResponseTypes,
  RpcMethods,
  BatchRequestsRpcRequest,
  BatchOperationRequest,
  BatchRequestsConfirmationPrompt,
  BatchRequestsConfirmationResponse,
  PinConfirmationPrompt,
  PinRequestResponse,
  BatchOperationDetail,
  SendTransactionDetails,
  CreateTokenDetails,
  SendNanoContractDetails,
  SignWithAddressDetails,
  SignOracleDataDetails,
  GetAddressDetails,
  GetBalanceDetails,
  GetUtxosDetails,
  ChangeNetworkDetails,
  BatchOperationResult,
} from '../types';
import {
  PromptRejectedError,
  InvalidParamsError,
  InsufficientFundsError,
  PrepareSendTransactionError,
  SendNanoContractTxError,
  NotImplementedError,
} from '../errors';
import { validateNetwork } from '../helpers';
import { createTokenRpcSchema } from '../schemas';
// Import schemas from existing RPC methods
import { sendTransactionSchema } from './sendTransaction';
import { signWithAddressSchema } from './signWithAddress';
import { signOracleDataSchema } from './signOracleData';
import { sendNanoContractSchema } from './sendNanoContractTx';
import { getAddressSchema } from './getAddress';
import { getBalanceSchema } from './getBalance';
import { getUtxosSchema } from './getUtxos';
import { changeNetworkSchema } from './changeNetwork';

const batchRequestsSchema = z.object({
  method: z.literal(RpcMethods.BatchRequests),
  params: z.object({
    network: z.string().min(1),
    requests: z.array(z.object({
      id: z.string().min(1),
      method: z.nativeEnum(RpcMethods),
      params: z.any(),
    })).min(1).max(20), // Limit to 20 operations
    errorHandling: z.enum(['fail-fast', 'continue-on-error']).default('fail-fast'),
  }),
});

/**
 * Prepares an operation for batch execution by validating and parsing its parameters
 */
async function prepareOperation(
  request: BatchOperationRequest,
  wallet: IHathorWallet,
): Promise<BatchOperationDetail> {

  switch (request.method) {
    case RpcMethods.SendTransaction: {
      // Validate schema
      const validationResult = sendTransactionSchema.safeParse({
        method: request.method,
        params: request.params,
      });

      if (!validationResult.success) {
        throw new InvalidParamsError(
          validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        );
      }

      const { params } = validationResult.data;

      // Prepare transaction (this validates inputs and calculates change)
      const stubPinCode = '111111';
      const sendTx = await wallet.sendManyOutputsSendTransaction(
        params.outputs,
        {
          inputs: params.inputs || [],
          changeAddress: params.changeAddress,
          pinCode: stubPinCode,
        }
      );

      let preparedTx;
      try {
        preparedTx = await sendTx.prepareTxData();
      } catch (err) {
        if (err instanceof Error) {
          if (err.message.includes('Insufficient amount of tokens')) {
            throw new InsufficientFundsError(err.message);
          }
        }
        throw new PrepareSendTransactionError(
          err instanceof Error ? err.message : 'Unknown error preparing transaction'
        );
      }

      return {
        id: request.id,
        method: request.method,
        description: 'Send Transaction',
        details: {
          type: 'sendTransaction',
          outputs: preparedTx.outputs,
          inputs: preparedTx.inputs,
          changeAddress: params.changeAddress,
        },
      };
    }

    case RpcMethods.CreateToken: {
      const params = createTokenRpcSchema.parse(request.params);

      if (params.options.changeAddress && !await wallet.isAddressMine(params.options.changeAddress)) {
        throw new Error('Change address is not from this wallet');
      }

      return {
        id: request.id,
        method: request.method,
        description: `Create Token: ${params.name} (${params.symbol})`,
        details: {
          type: 'createToken',
          name: params.name,
          symbol: params.symbol,
          amount: params.amount,
          mintAddress: params.options.mintAddress,
          changeAddress: params.options.changeAddress,
          createMint: params.options.createMint,
          mintAuthorityAddress: params.options.mintAuthorityAddress,
          allowExternalMintAuthorityAddress: params.options.allowExternalMintAuthorityAddress,
          createMelt: params.options.createMelt,
          meltAuthorityAddress: params.options.meltAuthorityAddress,
          allowExternalMeltAuthorityAddress: params.options.allowExternalMeltAuthorityAddress,
          data: params.options.data,
        },
      };
    }

    case RpcMethods.SendNanoContractTx: {
      const params = sendNanoContractSchema.parse(request.params);

      let blueprintId = params.blueprintId;
      if (blueprintId) {
        // Validate blueprint
        try {
          await ncApi.getBlueprintInformation(blueprintId);
        } catch (e) {
          throw new SendNanoContractTxError(`Invalid blueprint ID ${blueprintId}`);
        }
      } else {
        // Get blueprint from NC ID
        try {
          blueprintId = await nanoUtils.getBlueprintId(params.ncId!, wallet);
        } catch {
          throw new SendNanoContractTxError(
            `Error getting blueprint id with nc id ${params.ncId}`
          );
        }
      }

      // Validate and parse blueprint method args
      config.setServerUrl(wallet.getServerUrl());
      const result = await nanoUtils.validateAndParseBlueprintMethodArgs(
        blueprintId!,
        params.method,
        params.args,
        new Network(params.network)
      );
      const parsedArgs = result.map(data => ({ ...data, parsed: data.field.toUser() }));

      return {
        id: request.id,
        method: request.method,
        description: `Nano Contract: ${params.method}`,
        details: {
          type: 'sendNanoContract',
          blueprintId: blueprintId!,
          ncId: params.ncId,
          actions: params.actions,
          method: params.method,
          args: params.args,
          parsedArgs,
        },
      };
    }

    case RpcMethods.SignWithAddress: {
      const parseResult = signWithAddressSchema.safeParse({
        method: request.method,
        params: request.params,
      });

      if (!parseResult.success) {
        throw new InvalidParamsError(
          parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        );
      }

      const { params } = parseResult.data;
      const base58 = await wallet.getAddressAtIndex(params.addressIndex);
      const addressPath = await wallet.getAddressPathForIndex(params.addressIndex);

      const address: AddressInfoObject = {
        address: base58,
        index: params.addressIndex,
        addressPath,
        info: undefined,
      };

      return {
        id: request.id,
        method: request.method,
        description: `Sign Message with Address ${params.addressIndex}`,
        details: {
          type: 'signWithAddress',
          address,
          message: params.message,
        },
      };
    }

    case RpcMethods.SignOracleData: {
      const parseResult = signOracleDataSchema.safeParse(request.params);

      if (!parseResult.success) {
        throw new InvalidParamsError(
          parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        );
      }

      const params = parseResult.data;

      return {
        id: request.id,
        method: request.method,
        description: `Sign Oracle Data for ${params.oracle}`,
        details: {
          type: 'signOracleData',
          oracle: params.oracle,
          data: params.data,
        },
      };
    }

    case RpcMethods.GetAddress: {
      const params = getAddressSchema.parse(request.params);

      return {
        id: request.id,
        method: request.method,
        description: `Get Address (${params.type})`,
        details: {
          type: 'getAddress',
          addressType: params.type as 'first_empty' | 'index' | 'client' | 'full_path',
          index: 'index' in params ? params.index : undefined,
          fullPath: 'full_path' in params ? params.full_path : undefined,
        },
      };
    }

    case RpcMethods.GetBalance: {
      const params = getBalanceSchema.parse(request.params);

      return {
        id: request.id,
        method: request.method,
        description: `Get Balance (${params.tokens.length} token${params.tokens.length > 1 ? 's' : ''})`,
        details: {
          type: 'getBalance',
          tokens: params.tokens,
          addressIndexes: params.addressIndexes,
        },
      };
    }

    case RpcMethods.GetUtxos: {
      const validatedRequest = getUtxosSchema.parse({
        method: request.method,
        params: request.params,
      });

      return {
        id: request.id,
        method: request.method,
        description: `Get UTXOs${validatedRequest.params.token ? ` for token ${validatedRequest.params.token}` : ''}`,
        details: {
          type: 'getUtxos',
          token: validatedRequest.params.token,
          maxUtxos: validatedRequest.params.maxUtxos,
          filterAddress: validatedRequest.params.filterAddress,
          authorities: validatedRequest.params.authorities,
          amountSmallerThan: validatedRequest.params.amountSmallerThan,
          amountBiggerThan: validatedRequest.params.amountBiggerThan,
          maximumAmount: validatedRequest.params.maximumAmount,
          onlyAvailableUtxos: validatedRequest.params.onlyAvailableUtxos,
        },
      };
    }

    case RpcMethods.ChangeNetwork: {
      const params = changeNetworkSchema.parse(request.params);

      return {
        id: request.id,
        method: request.method,
        description: `Change Network to ${params.newNetwork}`,
        details: {
          type: 'changeNetwork',
          newNetwork: params.newNetwork,
        },
      };
    }

    default:
      throw new Error(`Unsupported batch operation: ${request.method}`);
  }
}

/**
 * Executes a prepared operation with the provided PIN code
 */
async function executeOperation(
  operation: BatchOperationDetail,
  wallet: IHathorWallet,
  pinCode: string | undefined,
  _metadata: RequestMetadata,
): Promise<any> {

  switch (operation.method) {
    case RpcMethods.SendTransaction: {
      const details = operation.details as SendTransactionDetails;

      // Transaction was already prepared in prepareOperation
      // Now we execute with the real PIN
      const sendTx = await wallet.sendManyOutputsSendTransaction(
        details.outputs as any,
        {
          inputs: details.inputs,
          changeAddress: details.changeAddress,
          pinCode: pinCode!,
        }
      );

      return await sendTx.run(null, pinCode!);
    }

    case RpcMethods.CreateToken: {
      const details = operation.details as CreateTokenDetails;

      return await wallet.createNewToken(
        details.name,
        details.symbol,
        details.amount,
        {
          mintAddress: details.mintAddress,
          changeAddress: details.changeAddress,
          createMint: details.createMint,
          mintAuthorityAddress: details.mintAuthorityAddress,
          allowExternalMintAuthorityAddress: details.allowExternalMintAuthorityAddress,
          createMelt: details.createMelt,
          meltAuthorityAddress: details.meltAuthorityAddress,
          allowExternalMeltAuthorityAddress: details.allowExternalMeltAuthorityAddress,
          data: details.data,
          pinCode: pinCode!,
        }
      );
    }

    case RpcMethods.SendNanoContractTx: {
      const details = operation.details as SendNanoContractDetails;

      // For nano contract, we need the caller address
      // Using the first address for now
      const caller = await wallet.getAddressAtIndex(0);

      const txData = {
        ncId: details.ncId,
        blueprintId: details.blueprintId,
        actions: details.actions,
        args: details.args,
      };

      return await wallet.createAndSendNanoContractTransaction(
        details.method,
        caller,
        txData,
        { pinCode: pinCode! }
      );
    }

    case RpcMethods.SignWithAddress: {
      const details = operation.details as SignWithAddressDetails;

      const signature = await wallet.signMessageWithAddress(
        details.message,
        details.address.index,
        pinCode!,
      );

      return {
        message: details.message,
        signature,
        address: details.address,
      };
    }

    case RpcMethods.SignOracleData: {
      const details = operation.details as SignOracleDataDetails;

      const type = 'str';
      const oracleDataBuffer = nanoUtils.getOracleBuffer(
        details.oracle,
        new Network(wallet.getNetworkObject().name)
      );

      const signedData = await nanoUtils.getOracleSignedDataFromUser(
        oracleDataBuffer,
        '', // nc_id not needed here
        `SignedData[${type}]`,
        details.data,
        wallet,
        { pinCode: pinCode! }
      );

      return {
        data: details.data,
        signedData,
        oracle: details.oracle,
      };
    }

    case RpcMethods.GetAddress: {
      const details = operation.details as GetAddressDetails;

      let addressInfo: AddressInfoObject;

      switch (details.addressType) {
        case 'first_empty':
          addressInfo = await wallet.getCurrentAddress();
          break;
        case 'full_path':
          throw new NotImplementedError('full_path not implemented');
        case 'index': {
          const address = await wallet.getAddressAtIndex(details.index!);
          const addressPath = await wallet.getAddressPathForIndex(details.index!);
          addressInfo = { address, index: details.index!, addressPath };
          break;
        }
        case 'client': {
          // For batch, 'client' type needs to be handled differently
          // as it requires additional user interaction mid-batch
          throw new Error('client type address requests not supported in batch');
        }
      }

      return addressInfo;
    }

    case RpcMethods.GetBalance: {
      const details = operation.details as GetBalanceDetails;

      if (details.addressIndexes) {
        throw new NotImplementedError('addressIndexes not implemented');
      }

      const balances = (await Promise.all(
        details.tokens.map(token => wallet.getBalance(token))
      )).flat();

      return balances;
    }

    case RpcMethods.GetUtxos: {
      const details = operation.details as GetUtxosDetails;

      const options = {
        token: details.token,
        authorities: details.authorities,
        max_utxos: details.maxUtxos,
        filter_address: details.filterAddress,
        amount_smaller_than: details.amountSmallerThan,
        amount_bigger_than: details.amountBiggerThan,
        max_amount: details.maximumAmount,
        only_available_utxos: details.onlyAvailableUtxos,
      };

      const utxoDetails = await wallet.getUtxos(options);
      return utxoDetails;
    }

    case RpcMethods.ChangeNetwork: {
      const details = operation.details as ChangeNetworkDetails;

      // changeNetwork RPC method just returns the new network
      // The actual network change is handled by the client
      return {
        newNetwork: details.newNetwork,
      };
    }

    default:
      throw new Error(`Unsupported operation: ${operation.method}`);
  }
}

/**
 * Handles the 'htr_batchRequests' RPC request by executing multiple operations
 * with a single user approval and PIN entry.
 */
export async function batchRequests(
  rpcRequest: BatchRequestsRpcRequest,
  wallet: IHathorWallet,
  requestMetadata: RequestMetadata,
  triggerHandler: TriggerHandler,
): Promise<RpcResponse> {

  // 1. Validate batch request schema
  const validationResult = batchRequestsSchema.safeParse(rpcRequest);

  if (!validationResult.success) {
    throw new InvalidParamsError(
      validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
    );
  }

  const params = validationResult.data.params;

  // 2. Validate network consistency
  validateNetwork(wallet, params.network);

  // 3. Validate all operations in params.requests use same network
  for (const request of params.requests) {
    if (request.params?.network && request.params.network !== params.network) {
      throw new InvalidParamsError(
        `All operations must use the same network. Expected ${params.network}, got ${request.params.network}`
      );
    }
  }

  // 4. Prepare all operations (validate and parse without executing)
  const operations: BatchOperationDetail[] = [];

  for (const request of params.requests) {
    try {
      const operationDetail = await prepareOperation(request as BatchOperationRequest, wallet);
      operations.push(operationDetail);
    } catch (err) {
      throw new InvalidParamsError(
        `Invalid parameters for operation ${request.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }

  // 5. Show batch confirmation prompt
  const batchConfirmPrompt: BatchRequestsConfirmationPrompt = {
    ...rpcRequest,
    type: TriggerTypes.BatchRequestsConfirmationPrompt,
    data: {
      network: params.network,
      operations,
      errorHandling: params.errorHandling,
    },
  };

  const confirmResponse = await triggerHandler(
    batchConfirmPrompt,
    requestMetadata
  ) as BatchRequestsConfirmationResponse;

  if (!confirmResponse.data.accepted) {
    throw new PromptRejectedError('User rejected batch request');
  }

  // 6. Request PIN once (only if there are write operations)
  const writeOperationMethods = [
    RpcMethods.SendTransaction,
    RpcMethods.CreateToken,
    RpcMethods.SendNanoContractTx,
    RpcMethods.SignWithAddress,
    RpcMethods.SignOracleData,
    RpcMethods.CreateNanoContractCreateTokenTx,
  ];

  const hasWriteOperations = operations.some(op =>
    writeOperationMethods.includes(op.method as RpcMethods)
  );

  let pinCode: string | undefined;

  if (hasWriteOperations) {
    const pinPrompt: PinConfirmationPrompt = {
      ...rpcRequest,
      type: TriggerTypes.PinConfirmationPrompt,
    };

    const pinResponse = await triggerHandler(
      pinPrompt,
      requestMetadata
    ) as PinRequestResponse;

    if (!pinResponse.data.accepted) {
      throw new PromptRejectedError('User rejected PIN prompt');
    }

    pinCode = pinResponse.data.pinCode;
  }

  // 7. Show initial loading state
  triggerHandler({
    type: TriggerTypes.BatchRequestsLoadingTrigger,
    data: {
      total: operations.length,
      current: 0,
      currentOperation: operations[0]?.id || '',
    },
  }, requestMetadata);

  // 8. Execute operations sequentially
  const results: BatchOperationResult[] = [];
  const errorHandling = params.errorHandling;

  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i];

    // Update loading state
    triggerHandler({
      type: TriggerTypes.BatchRequestsLoadingTrigger,
      data: {
        total: operations.length,
        current: i + 1,
        currentOperation: operation.id,
      },
    }, requestMetadata);

    try {
      const result = await executeOperation(
        operation,
        wallet,
        pinCode,
        requestMetadata
      );

      results.push({
        id: operation.id,
        status: 'success',
        response: result,
      });

    } catch (err) {
      const error = {
        code: (err as any).code || 'UNKNOWN_ERROR',
        message: err instanceof Error ? err.message : 'An unknown error occurred',
      };

      results.push({
        id: operation.id,
        status: 'failed',
        error,
      });

      // Handle error based on strategy
      if (errorHandling === 'fail-fast') {
        // Mark remaining operations as skipped
        for (let j = i + 1; j < operations.length; j++) {
          results.push({
            id: operations[j].id,
            status: 'skipped',
          });
        }
        break;
      }
      // If continue-on-error, continue to next operation
    }
  }

  // 9. Hide loading state
  triggerHandler({
    type: TriggerTypes.BatchRequestsLoadingFinishedTrigger,
  }, requestMetadata);

  // 10. Determine overall status
  const allSuccess = results.every(r => r.status === 'success');
  const allFailed = results.every(r => r.status === 'failed' || r.status === 'skipped');
  const status = allSuccess ? 'success' : allFailed ? 'failed' : 'partial-success';

  // 11. Return results
  return {
    type: RpcResponseTypes.BatchRequestsResponse,
    response: {
      status,
      results,
    },
  };
}
