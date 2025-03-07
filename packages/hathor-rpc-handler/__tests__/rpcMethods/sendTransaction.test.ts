/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from '@hathor/wallet-lib';
import { sendTransaction } from '../../src/rpcMethods/sendTransaction';
import {
  RpcMethods,
  SendTransactionRpcRequest,
  TriggerTypes,
  TriggerResponseTypes,
  RpcResponseTypes,
} from '../../src/types';
import {
  InvalidParamsError,
  PromptRejectedError,
  SendTransactionError,
  InsufficientFundsError,
  DifferentNetworkError,
} from '../../src/errors';

describe('sendTransaction', () => {
  let rpcRequest: SendTransactionRpcRequest;
  let wallet: jest.Mocked<HathorWallet>;
  let promptHandler: jest.Mock;
  let sendTransactionMock: jest.Mock;

  beforeEach(() => {
    // Setup basic request
    rpcRequest = {
      method: RpcMethods.SendTransaction,
      params: {
        network: 'testnet',
        outputs: [{
          address: 'testAddress',
          value: '100',
          token: '00',
        }],
        inputs: [{
          txId: 'testTxId',
          index: 0,
        }],
        changeAddress: 'changeAddress',
      },
    };

    // Mock wallet
    sendTransactionMock = jest.fn();
    wallet = {
      getNetwork: jest.fn().mockReturnValue('testnet'),
      sendManyOutputsSendTransaction: jest.fn().mockResolvedValue({
        prepareTxData: jest.fn().mockResolvedValue({
          inputs: [{
            txId: 'testTxId',
            index: 0,
            value: 100,
            address: 'testAddress',
            token: '00',
          }],
        }),
        run: sendTransactionMock,
      }),
    } as unknown as jest.Mocked<HathorWallet>;

    // Mock prompt handler
    promptHandler = jest.fn();
  });

  it('should successfully send a transaction', async () => {
    const pinCode = '1234';
    const txResponse = { hash: 'txHash123' };

    // Mock prompt responses
    promptHandler
      // Transaction confirmation prompt
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendTransactionConfirmationResponse,
        data: { accepted: true },
      })
      // PIN confirmation prompt
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: { accepted: true, pinCode },
      });

    sendTransactionMock.mockResolvedValue(txResponse);

    const response = await sendTransaction(rpcRequest, wallet, {}, promptHandler);

    expect(response).toEqual({
      type: RpcResponseTypes.SendTransactionResponse,
      response: txResponse,
    });

    // Verify all prompts were shown in correct order
    expect(promptHandler).toHaveBeenCalledTimes(4); // Confirmation, PIN, Loading, LoadingFinished
    expect(promptHandler).toHaveBeenNthCalledWith(1, {
      type: TriggerTypes.SendTransactionConfirmationPrompt,
      method: rpcRequest.method,
      data: {
        outputs: [{
          address: 'testAddress',
          value: BigInt(100),
          token: '00',
        }],
        inputs: [{
          txId: 'testTxId',
          index: 0,
          value: 100,
          address: 'testAddress',
          token: '00',
        }],
        changeAddress: 'changeAddress',
      },
    }, {});
    expect(promptHandler).toHaveBeenNthCalledWith(2, {
      type: TriggerTypes.PinConfirmationPrompt,
      method: rpcRequest.method,
    }, {});
  });

  it('should throw InvalidParamsError for invalid request parameters', async () => {
    // Invalid request with missing required fields
    const invalidRequest = {
      method: RpcMethods.SendTransaction,
      params: {
        network: '',  // Invalid: empty string
        outputs: [],  // Invalid: empty array
      },
    } as SendTransactionRpcRequest;

    await expect(sendTransaction(invalidRequest, wallet, {}, promptHandler))
      .rejects
      .toThrow(InvalidParamsError);

    expect(promptHandler).not.toHaveBeenCalled();
  });

  it('should throw PromptRejectedError when transaction confirmation is rejected', async () => {
    promptHandler.mockResolvedValueOnce({
      type: TriggerResponseTypes.SendTransactionConfirmationResponse,
      data: { accepted: false },
    });

    await expect(sendTransaction(rpcRequest, wallet, {}, promptHandler))
      .rejects
      .toThrow(PromptRejectedError);

    expect(promptHandler).toHaveBeenCalledTimes(1);
  });

  it('should throw PromptRejectedError when PIN confirmation is rejected', async () => {
    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendTransactionConfirmationResponse,
        data: { accepted: true },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: { accepted: false },
      });

    await expect(sendTransaction(rpcRequest, wallet, {}, promptHandler))
      .rejects
      .toThrow(PromptRejectedError);

    expect(promptHandler).toHaveBeenCalledTimes(2);
  });

  it('should throw InsufficientFundsError when not enough funds available', async () => {
    wallet.sendManyOutputsSendTransaction.mockResolvedValue({
      prepareTxData: jest.fn().mockRejectedValue(
        new Error('Insufficient amount of tokens')
      ),
    });

    await expect(sendTransaction(rpcRequest, wallet, {}, promptHandler))
      .rejects
      .toThrow(InsufficientFundsError);

    expect(promptHandler).not.toHaveBeenCalled();
  });

  it('should throw SendTransactionError when transaction preparation fails', async () => {
    wallet.sendManyOutputsSendTransaction.mockResolvedValue({
      prepareTxData: jest.fn().mockRejectedValue(
        new Error('Failed to prepare transaction')
      ),
    });

    await expect(sendTransaction(rpcRequest, wallet, {}, promptHandler))
      .rejects
      .toThrow(SendTransactionError);

    expect(promptHandler).not.toHaveBeenCalled();
  });

  it('should throw SendTransactionError when transaction execution fails', async () => {
    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendTransactionConfirmationResponse,
        data: { accepted: true },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: { accepted: true, pinCode: '1234' },
      });

    sendTransactionMock.mockRejectedValue(
      new Error('Failed to execute transaction')
    );

    await expect(sendTransaction(rpcRequest, wallet, {}, promptHandler))
      .rejects
      .toThrow(SendTransactionError);

    expect(promptHandler).toHaveBeenCalledTimes(3); // Confirmation, PIN, and Loading
  });

  it('should throw DifferentNetworkError when networks do not match', async () => {
    wallet.getNetwork.mockReturnValue('mainnet');

    await expect(sendTransaction(rpcRequest, wallet, {}, promptHandler))
      .rejects
      .toThrow(DifferentNetworkError);

    expect(promptHandler).not.toHaveBeenCalled();
  });
}); 