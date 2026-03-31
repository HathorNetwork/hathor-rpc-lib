/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { constants, type IHathorWallet } from '@hathor/wallet-lib';
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
  PrepareSendTransactionError,
} from '../../src/errors';

describe('sendTransaction', () => {
  let rpcRequest: SendTransactionRpcRequest;
  let wallet: jest.Mocked<IHathorWallet>;
  let promptHandler: jest.Mock;
  let sendTransactionMock: jest.Mock;
  let mockTransaction: Record<string, unknown>;

  // A valid P2PKH script (25 bytes: OP_DUP OP_HASH160 pushdata(20) <20-byte-hash> OP_EQUALVERIFY OP_CHECKSIG)
  // so that P2PKH.identify() returns true during fee calculation
  const p2pkhScript = Buffer.from([0x76, 0xa9, 0x14, ...new Array(20).fill(0), 0x88, 0xac]);

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
        push_tx: true,
      },
    };

    // Mock wallet
    sendTransactionMock = jest.fn();

    // Create a mock Transaction object returned by prepareTx()
    mockTransaction = {
      inputs: [{ hash: 'testTxId', index: 0 }],
      outputs: [{ value: BigInt(100), tokenData: 0, script: p2pkhScript }],
      tokens: [],
      getFeeHeader: jest.fn().mockReturnValue({
        entries: [{ tokenIndex: 0, amount: 0n }],
      }),
      toHex: jest.fn().mockReturnValue('mockedTxHex'),
    };

    wallet = {
      getNetwork: jest.fn().mockReturnValue('testnet'),
      getTokenDetails: jest.fn().mockResolvedValue({
        tokenInfo: {
          name: 'Test Token',
          symbol: 'TST',
          uid: 'test-token-uid',
        },
      }),
      sendManyOutputsSendTransaction: jest.fn().mockResolvedValue({
        prepareTx: jest.fn().mockResolvedValue(mockTransaction),
        signTx: jest.fn().mockResolvedValue(mockTransaction),
        runFromMining: sendTransactionMock,
        releaseUtxos: jest.fn().mockResolvedValue(undefined),
      }),
    } as unknown as jest.Mocked<IHathorWallet>;

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
      ...rpcRequest,
      type: TriggerTypes.SendTransactionConfirmationPrompt,
      data: {
        changeAddress: 'changeAddress',
        pushTx: true,
        tokenDetails: new Map(),
        fee: 0n,
        preparedTx: mockTransaction,
      },
    }, {});
    expect(promptHandler).toHaveBeenNthCalledWith(2, {
      ...rpcRequest,
      type: TriggerTypes.PinConfirmationPrompt,
    }, {});
  });

  it('should handle data outputs correctly', async () => {
    rpcRequest.params.outputs = [{
      type: 'data',
      data: 'test data',
    }];

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendTransactionConfirmationResponse,
        data: { accepted: true },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: { accepted: true, pinCode: '1234' },
      });

    sendTransactionMock.mockResolvedValue({ hash: 'txHash123' });

    await sendTransaction(rpcRequest, wallet, {}, promptHandler);

    // Verify data output was transformed correctly
    expect(wallet.sendManyOutputsSendTransaction).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'data',
          data: 'test data',
        }),
      ]),
      expect.any(Object),
    );
  });

  it('should handle mix of data and regular outputs correctly', async () => {
    rpcRequest.params.outputs = [
      {
        address: 'testAddress1',
        value: '100',
        token: '00',
      },
      {
        type: 'data',
        data: 'data item',
      },
      {
        address: 'testAddress2',
        value: '200',
        token: '00',
      }
    ];

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendTransactionConfirmationResponse,
        data: { accepted: true },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: { accepted: true, pinCode: '1234' },
      });

    sendTransactionMock.mockResolvedValue({ hash: 'txHash123' });

    await sendTransaction(rpcRequest, wallet, {}, promptHandler);

    // Verify the transformation preserves regular outputs and handles data output
    expect(wallet.sendManyOutputsSendTransaction).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          address: 'testAddress1',
          value: BigInt(100),
          token: '00',
        }),
        expect.objectContaining({
          type: 'data',
          data: 'data item',
        }),
        expect.objectContaining({
          address: 'testAddress2',
          value: BigInt(200),
          token: '00',
        }),
      ]),
      expect.any(Object),
    );

    // Verify the array length matches the expected number of outputs (2 regular + 1 data output)
    expect(wallet.sendManyOutputsSendTransaction.mock.calls[0][0]).toHaveLength(3);
  });

  it('should throw InvalidParamsError for invalid request parameters', async () => {
    // Invalid request with missing required fields
    const invalidRequest = {
      method: RpcMethods.SendTransaction,
      params: {
        network: '',  // Invalid: empty string
        outputs: [],  // Invalid: empty array
        push_tx: true,
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
    (wallet.sendManyOutputsSendTransaction as jest.Mock).mockResolvedValue({
      prepareTx: jest.fn().mockRejectedValue(
        new Error('Insufficient amount of tokens')
      ),
    });

    await expect(sendTransaction(rpcRequest, wallet, {}, promptHandler))
      .rejects
      .toThrow(InsufficientFundsError);

    expect(promptHandler).not.toHaveBeenCalled();
  });

  it('should throw SendTransactionError when transaction preparation fails', async () => {
    (wallet.sendManyOutputsSendTransaction as jest.Mock).mockImplementation(() => {
      return {
        prepareTx: jest.fn().mockRejectedValue(new Error('Failed to prepare transaction')),
      };
    });

    await expect(sendTransaction(rpcRequest, wallet, {}, promptHandler))
      .rejects
      .toThrow(PrepareSendTransactionError);

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

  it('should reject transactions with zero amount', async () => {
    const requestWithZeroAmount = {
      ...rpcRequest,
      params: {
        ...rpcRequest.params,
        outputs: [{
          address: 'testAddress',
          value: '0', // Zero amount should be rejected
          token: '00',
        }],
      },
    };

    // The validation should fail with a specific error
    await expect(
      sendTransaction(requestWithZeroAmount, wallet, {}, promptHandler)
    ).rejects.toThrow(InvalidParamsError);

    // Verify that the promptHandler wasn't called since validation should fail first
    expect(promptHandler).not.toHaveBeenCalled();
  });

  it('should default to native token UID when no token is specified', async () => {
    // Remove token from the output to simulate the simple case
    rpcRequest.params.outputs = [{
      address: 'testAddress',
      value: '100',
      // No token specified
    }];

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendTransactionConfirmationResponse,
        data: { accepted: true },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: { accepted: true, pinCode: '1234' },
      });

    sendTransactionMock.mockResolvedValue({ hash: 'txHash123' });

    await sendTransaction(rpcRequest, wallet, {}, promptHandler);

    // Verify that the wallet is called with the native token UID
    expect(wallet.sendManyOutputsSendTransaction).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          address: 'testAddress',
          value: BigInt(100),
          token: constants.NATIVE_TOKEN_UID,
        }),
      ]),
      expect.any(Object),
    );
  });

  it('should return transaction hex when push_tx is false', async () => {
    const requestWithPushTxFalse = {
      ...rpcRequest,
      params: {
        ...rpcRequest.params,
        push_tx: false,
      },
    } as SendTransactionRpcRequest;

    const mockHex = '00010203';

    const mockPreparedTransaction = {
      inputs: [{ hash: 'testTxId', index: 0 }],
      outputs: [{ value: BigInt(100), tokenData: 0, script: p2pkhScript }],
      tokens: [],
      getFeeHeader: jest.fn().mockReturnValue({
        entries: [{ tokenIndex: 0, amount: 0n }],
      }),
    };

    const mockSignedTransaction = {
      toHex: jest.fn().mockReturnValue(mockHex),
    };
    const signTxMock = jest.fn().mockResolvedValue(mockSignedTransaction);

    (wallet.sendManyOutputsSendTransaction as jest.Mock).mockResolvedValue({
      prepareTx: jest.fn().mockResolvedValue(mockPreparedTransaction),
      signTx: signTxMock,
      runFromMining: sendTransactionMock,
      releaseUtxos: jest.fn().mockResolvedValue(undefined),
    });

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendTransactionConfirmationResponse,
        data: { accepted: true },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: { accepted: true, pinCode: '1234' },
      });

    const response = await sendTransaction(requestWithPushTxFalse, wallet, {}, promptHandler);

    expect(signTxMock).toHaveBeenCalledWith('1234');
    expect(sendTransactionMock).not.toHaveBeenCalled(); // runFromMining should not be called
    expect(response).toEqual({
      type: RpcResponseTypes.SendTransactionResponse,
      response: mockHex,
    });
  });

  it('should execute transaction when push_tx is true', async () => {
    const requestWithPushTxTrue = {
      ...rpcRequest,
      params: {
        ...rpcRequest.params,
        push_tx: true,
      },
    } as SendTransactionRpcRequest;

    const txResponse = { hash: 'txHash123' };
    const signTxMock = jest.fn().mockResolvedValue({ toHex: jest.fn() });

    const mockTransaction = {
      inputs: [{ hash: 'testTxId', index: 0 }],
      outputs: [{ value: BigInt(100), tokenData: 0, script: p2pkhScript }],
      tokens: [],
      getFeeHeader: jest.fn().mockReturnValue({
        entries: [{ tokenIndex: 0, amount: 0n }],
      }),
    };

    (wallet.sendManyOutputsSendTransaction as jest.Mock).mockResolvedValue({
      prepareTx: jest.fn().mockResolvedValue(mockTransaction),
      signTx: signTxMock,
      runFromMining: sendTransactionMock.mockResolvedValue(txResponse),
      releaseUtxos: jest.fn().mockResolvedValue(undefined),
    });

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendTransactionConfirmationResponse,
        data: { accepted: true },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: { accepted: true, pinCode: '1234' },
      });

    const response = await sendTransaction(requestWithPushTxTrue, wallet, {}, promptHandler);

    expect(signTxMock).toHaveBeenCalledWith('1234');
    expect(sendTransactionMock).toHaveBeenCalled(); // runFromMining should be called
    expect(response).toEqual({
      type: RpcResponseTypes.SendTransactionResponse,
      response: txResponse,
    });
  });

  it('should calculate non-zero fee when FBT fee header is present', async () => {
    const fbtTokenUid = 'fbt-token-uid-abc123';

    // Use a non-native token in the request outputs
    rpcRequest.params.outputs = [{
      address: 'testAddress',
      value: '100',
      token: fbtTokenUid,
    }];

    const fbtMockTransaction = {
      inputs: [{ hash: 'testTxId', index: 0 }],
      outputs: [{ value: BigInt(100), tokenData: 0, script: p2pkhScript }],
      tokens: [fbtTokenUid],
      getFeeHeader: jest.fn().mockReturnValue({
        entries: [{ tokenIndex: 0, amount: 500n }],
      }),
      toHex: jest.fn().mockReturnValue('mockedTxHex'),
    };

    (wallet.sendManyOutputsSendTransaction as jest.Mock).mockResolvedValue({
      prepareTx: jest.fn().mockResolvedValue(fbtMockTransaction),
      signTx: jest.fn().mockResolvedValue(fbtMockTransaction),
      runFromMining: sendTransactionMock.mockResolvedValue({ hash: 'txHash123' }),
      releaseUtxos: jest.fn().mockResolvedValue(undefined),
    });

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendTransactionConfirmationResponse,
        data: { accepted: true },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: { accepted: true, pinCode: '1234' },
      });

    await sendTransaction(rpcRequest, wallet, {}, promptHandler);

    // Verify token details were fetched for the non-native token
    expect(wallet.getTokenDetails).toHaveBeenCalledWith(fbtTokenUid);

    // Verify the confirmation prompt was called with non-zero fee and token details
    expect(promptHandler).toHaveBeenNthCalledWith(1,
      expect.objectContaining({
        type: TriggerTypes.SendTransactionConfirmationPrompt,
        data: expect.objectContaining({
          fee: 500n,
          tokenDetails: expect.any(Map),
        }),
      }),
      {},
    );
  });

  it('should call releaseUtxos when user rejects confirmation prompt', async () => {
    const releaseUtxosMock = jest.fn().mockResolvedValue(undefined);
    (wallet.sendManyOutputsSendTransaction as jest.Mock).mockResolvedValue({
      prepareTx: jest.fn().mockResolvedValue(mockTransaction),
      signTx: jest.fn().mockResolvedValue(mockTransaction),
      runFromMining: sendTransactionMock,
      releaseUtxos: releaseUtxosMock,
    });

    promptHandler.mockResolvedValueOnce({
      type: TriggerResponseTypes.SendTransactionConfirmationResponse,
      data: { accepted: false },
    });

    await expect(sendTransaction(rpcRequest, wallet, {}, promptHandler))
      .rejects
      .toThrow(PromptRejectedError);

    expect(releaseUtxosMock).toHaveBeenCalledTimes(1);
  });

  it('should call releaseUtxos when user rejects PIN prompt', async () => {
    const releaseUtxosMock = jest.fn().mockResolvedValue(undefined);
    (wallet.sendManyOutputsSendTransaction as jest.Mock).mockResolvedValue({
      prepareTx: jest.fn().mockResolvedValue(mockTransaction),
      signTx: jest.fn().mockResolvedValue(mockTransaction),
      runFromMining: sendTransactionMock,
      releaseUtxos: releaseUtxosMock,
    });

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

    expect(releaseUtxosMock).toHaveBeenCalledTimes(1);
  });

  it('should call releaseUtxos (best-effort) when transaction execution fails', async () => {
    const releaseUtxosMock = jest.fn().mockResolvedValue(undefined);
    (wallet.sendManyOutputsSendTransaction as jest.Mock).mockResolvedValue({
      prepareTx: jest.fn().mockResolvedValue(mockTransaction),
      signTx: jest.fn().mockResolvedValue(mockTransaction),
      runFromMining: jest.fn().mockRejectedValue(new Error('execution failed')),
      releaseUtxos: releaseUtxosMock,
    });

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendTransactionConfirmationResponse,
        data: { accepted: true },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: { accepted: true, pinCode: '1234' },
      });

    await expect(sendTransaction(rpcRequest, wallet, {}, promptHandler))
      .rejects
      .toThrow(SendTransactionError);

    expect(releaseUtxosMock).toHaveBeenCalledTimes(1);
  });
});
