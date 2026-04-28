/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { nanoUtils, ncApi, type IHathorWallet } from '@hathor/wallet-lib';
import { NanoContractAction } from '@hathor/wallet-lib/lib/nano_contracts/types';
import { sendNanoContractTx, NanoContractActionWithStringAmount } from '../../src/rpcMethods/sendNanoContractTx';
import { TriggerTypes, RpcMethods, SendNanoContractRpcRequest, SendNanoContractTxConfirmationPrompt, TriggerResponseTypes, RpcResponseTypes } from '../../src/types';
import { SendNanoContractTxError, InvalidParamsError, PromptRejectedError } from '../../src/errors';

// Mock transactionUtils.signTransaction
jest.mock('@hathor/wallet-lib', () => {
  const actual = jest.requireActual('@hathor/wallet-lib');
  return {
    ...actual,
    transactionUtils: {
      ...actual.transactionUtils,
      signTransaction: jest.fn().mockResolvedValue(undefined),
    },
  };
});

jest.spyOn(nanoUtils, 'validateAndParseBlueprintMethodArgs').mockResolvedValue([]);
jest.spyOn(nanoUtils, 'getBlueprintId').mockResolvedValue('test-blueprint');
jest.spyOn(ncApi, 'getBlueprintInformation').mockResolvedValue({
  id: 'mock-blueprint-id',
  name: 'mock-blueprint',
  attributes: new Map(),
  public_methods: new Map(),
  view_methods: new Map(),
});

describe('sendNanoContractTx', () => {
  let rpcRequest: SendNanoContractRpcRequest;
  let wallet: IHathorWallet;
  let promptHandler = jest.fn();

  beforeEach(() => {
    // Using proper type casting to make TypeScript happy
    const actions = [
      {
        type: 'deposit',
        address: 'test-address',
        token: '00',
        amount: '100', // Using string for amount
      } as NanoContractActionWithStringAmount
    ];

    rpcRequest = {
      method: RpcMethods.SendNanoContractTx,
      id: '1',
      jsonrpc: '2.0',
      params: {
        network: 'mainnet',
        method: 'initialize',
        blueprint_id: 'blueprint123',
        nc_id: 'nc123',
        actions: actions as unknown as NanoContractAction[],
        args: [],
        push_tx: true,
      }
    } as SendNanoContractRpcRequest;

    const mockTransaction = {
      getFeeHeader: jest.fn().mockReturnValue({ entries: [] }),
      getNanoHeaders: jest.fn().mockReturnValue([{ address: null, seqnum: 0 }]),
      prepareToSend: jest.fn(),
      toHex: jest.fn().mockReturnValue('tx-hex'),
    };

    wallet = {
      createAndSendNanoContractTransaction: jest.fn(),
      createNanoContractTransaction: jest.fn().mockResolvedValue({
        transaction: mockTransaction,
        runFromMining: jest.fn().mockResolvedValue({ tx_id: 'mock-tx-id' }),
        releaseUtxos: jest.fn().mockResolvedValue(undefined),
      }),
      getServerUrl: jest.fn(),
      getTokenDetails: jest.fn().mockResolvedValue({
        tokenInfo: {
          name: 'Test Token',
          symbol: 'TST',
          uid: 'test-token-uid',
        },
      }),
      getAddressAtIndex: jest.fn().mockResolvedValue('temp-address'),
      getNanoHeaderSeqnum: jest.fn().mockResolvedValue(1),
      getNetworkObject: jest.fn().mockReturnValue({ name: 'mainnet' }),
      setNanoHeaderCaller: jest.fn().mockResolvedValue(undefined),
      signTx: jest.fn().mockResolvedValue(undefined),
      storage: {},
    } as unknown as IHathorWallet;

    promptHandler = jest.fn();
  });

  it('should send a nano contract transaction successfully', async () => {
    const pinCode = '1234';
    const address = 'address123';
    const response = { tx_id: 'mock-tx-id' };

    // Create mock transaction with all required methods
    const mockTransaction = {
      getFeeHeader: jest.fn().mockReturnValue({ entries: [] }),
      getNanoHeaders: jest.fn().mockReturnValue([{ address: null, seqnum: 0 }]),
      prepareToSend: jest.fn(),
      toHex: jest.fn().mockReturnValue('tx-hex'),
    };
    const mockSendTx = {
      transaction: mockTransaction,
      runFromMining: jest.fn().mockResolvedValue(response),
      releaseUtxos: jest.fn().mockResolvedValue(undefined),
    };
    (wallet.createNanoContractTransaction as jest.Mock).mockResolvedValue(mockSendTx);

    // Expected action after transformation
    const expectedActions = [
      {
        ...(rpcRequest.params.actions[0] as unknown as NanoContractActionWithStringAmount),
        amount: 100n, // Expected conversion to BigInt
      }
    ];

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendNanoContractTxConfirmationResponse,
        data: {
          accepted: true,
          nc: {
            caller: address,
            method: rpcRequest.params.method,
            blueprintId: rpcRequest.params.blueprint_id,
            ncId: rpcRequest.params.nc_id,
            args: rpcRequest.params.args,
            parsedArgs: [],
            actions: expectedActions,
            pushTx: true,
            fee: 0n,
          },
        }
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: true,
          pinCode,
        }
      });

    const result = await sendNanoContractTx(rpcRequest, wallet, {}, promptHandler);

    expect(promptHandler).toHaveBeenCalledTimes(4);
    expect(promptHandler).toHaveBeenCalledWith({
      ...rpcRequest,
      type: TriggerTypes.PinConfirmationPrompt,
    }, {});

    // Verify pre-build was called with signTx: false
    expect(wallet.createNanoContractTransaction).toHaveBeenCalledWith(
      rpcRequest.params.method,
      'temp-address', // Uses temp address for pre-build
      expect.objectContaining({
        blueprintId: rpcRequest.params.blueprint_id,
        ncId: rpcRequest.params.nc_id,
      }),
      expect.objectContaining({ signTx: false })
    );

    // Verify transaction was signed and sent
    expect(mockSendTx.runFromMining).toHaveBeenCalled();
    expect(result).toEqual({
      type: RpcResponseTypes.SendNanoContractTxResponse,
      response,
    });
  });

  it('should transform string amounts to BigInt in actions', async () => {
    // Setup the request with string amounts
    const stringActions = [
      {
        type: 'deposit',
        address: 'test-address',
        token: '00',
        amount: '100', // Using string amount
      } as NanoContractActionWithStringAmount,
      {
        type: 'withdrawal',
        address: 'test-address-2',
        token: '01',
        amount: '200', // Another string amount
        changeAddress: 'change-address', // Add missing property
      } as NanoContractActionWithStringAmount,
    ];

    const requestWithStringAmount = {
      ...rpcRequest,
      params: {
        ...rpcRequest.params,
        actions: stringActions as unknown as NanoContractAction[],
      },
    } as SendNanoContractRpcRequest;

    const expectedActions = [
      {
        ...stringActions[0],
        amount: 100n,
      },
      {
        ...stringActions[1],
        amount: 200n,
      },
    ];

    // Create mock transaction with all required methods
    const mockTransaction = {
      getFeeHeader: jest.fn().mockReturnValue({ entries: [] }),
      getNanoHeaders: jest.fn().mockReturnValue([{ address: null, seqnum: 0 }]),
      prepareToSend: jest.fn(),
      toHex: jest.fn().mockReturnValue('tx-hex'),
    };
    const mockSendTx = {
      transaction: mockTransaction,
      runFromMining: jest.fn().mockResolvedValue({ tx_id: 'mock-tx-id' }),
      releaseUtxos: jest.fn().mockResolvedValue(undefined),
    };
    (wallet.createNanoContractTransaction as jest.Mock).mockResolvedValue(mockSendTx);

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendNanoContractTxConfirmationResponse,
        data: {
          accepted: true,
          nc: {
            caller: 'address123',
            method: requestWithStringAmount.params.method,
            blueprintId: requestWithStringAmount.params.blueprint_id,
            ncId: requestWithStringAmount.params.nc_id,
            args: requestWithStringAmount.params.args,
            parsedArgs: [],
            actions: expectedActions, // Using transformed actions
            pushTx: true,
            fee: 0n,
          },
        }
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: true,
          pinCode: '1234',
        }
      });

    await sendNanoContractTx(requestWithStringAmount, wallet, {}, promptHandler);

    // Verify the pre-build was called (the actions are transformed before prompt)
    expect(wallet.createNanoContractTransaction).toHaveBeenCalledWith(
      requestWithStringAmount.params.method,
      'temp-address',
      expect.objectContaining({
        actions: expectedActions, // Expect BigInt conversions
      }),
      expect.objectContaining({ signTx: false })
    );
  });

  it('should handle large integer values as strings', async () => {
    // Very large number that would cause precision issues as a regular number
    const largeAmount = '9007199254740993'; // 2^53 + 1, beyond Number.MAX_SAFE_INTEGER

    const largeActions = [
      {
        type: 'deposit',
        address: 'test-address',
        token: '00',
        amount: largeAmount, // Very large integer as string
      } as NanoContractActionWithStringAmount
    ];

    const requestWithLargeAmount = {
      ...rpcRequest,
      params: {
        ...rpcRequest.params,
        actions: largeActions as unknown as NanoContractAction[],
      },
    } as SendNanoContractRpcRequest;

    const expectedActions = [
      {
        ...largeActions[0],
        amount: BigInt(largeAmount), // Expect conversion to BigInt
      }
    ];

    // Create mock transaction with all required methods
    const mockTransaction = {
      getFeeHeader: jest.fn().mockReturnValue({ entries: [] }),
      getNanoHeaders: jest.fn().mockReturnValue([{ address: null, seqnum: 0 }]),
      prepareToSend: jest.fn(),
      toHex: jest.fn().mockReturnValue('tx-hex'),
    };
    const mockSendTx = {
      transaction: mockTransaction,
      runFromMining: jest.fn().mockResolvedValue({ tx_id: 'mock-tx-id' }),
      releaseUtxos: jest.fn().mockResolvedValue(undefined),
    };
    (wallet.createNanoContractTransaction as jest.Mock).mockResolvedValue(mockSendTx);

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendNanoContractTxConfirmationResponse,
        data: {
          accepted: true,
          nc: {
            caller: 'address123',
            method: requestWithLargeAmount.params.method,
            blueprintId: requestWithLargeAmount.params.blueprint_id,
            ncId: requestWithLargeAmount.params.nc_id,
            args: requestWithLargeAmount.params.args,
            parsedArgs: [],
            actions: expectedActions, // Using transformed actions
            pushTx: true,
            fee: 0n,
          },
        }
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: true,
          pinCode: '1234',
        }
      });

    await sendNanoContractTx(requestWithLargeAmount, wallet, {}, promptHandler);

    // Verify the pre-build was called with large BigInt amounts
    expect(wallet.createNanoContractTransaction).toHaveBeenCalledWith(
      requestWithLargeAmount.params.method,
      'temp-address',
      expect.objectContaining({
        actions: expectedActions, // Expect the large BigInt conversion
      }),
      expect.objectContaining({ signTx: false })
    );
  });

  it('should throw SendNanoContractTxFailure if the transaction fails', async () => {
    const pinCode = '1234';
    const originalAction = rpcRequest.params.actions[0] as unknown as NanoContractActionWithStringAmount;

    const ncData = {
      method: 'initialize',
      blueprintId: rpcRequest.params.blueprint_id,
      ncId: rpcRequest.params.nc_id,
      args: rpcRequest.params.args,
      parsedArgs: [],
      actions: [{
        ...originalAction,
        amount: 100n, // Convert amount to BigInt
      }],
      pushTx: true,
      fee: 0n,
    };

    // Mock createNanoContractTransaction to return a result that throws on runFromMining
    const mockTransaction = {
      getFeeHeader: jest.fn().mockReturnValue({ entries: [] }),
      getNanoHeaders: jest.fn().mockReturnValue([{ address: null, seqnum: 0 }]),
      prepareToSend: jest.fn(),
      toHex: jest.fn().mockReturnValue('tx-hex'),
    };
    (wallet.createNanoContractTransaction as jest.Mock).mockResolvedValue({
      transaction: mockTransaction,
      runFromMining: jest.fn().mockRejectedValue(new Error('Transaction failed')),
      releaseUtxos: jest.fn().mockResolvedValue(undefined),
    });

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendNanoContractTxConfirmationResponse,
        data: {
          accepted: true,
          nc: {
            ...ncData,
            caller: 'address123',
          }
        }
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: true,
          pinCode,
        }
      });

    await expect(sendNanoContractTx(rpcRequest, wallet, {}, promptHandler)).rejects.toThrow(SendNanoContractTxError);

    expect(promptHandler).toHaveBeenCalledTimes(3);
    expect(promptHandler).toHaveBeenNthCalledWith(1,
      expect.objectContaining({
        type: TriggerTypes.SendNanoContractTxConfirmationPrompt,
        data: expect.objectContaining({
          fee: 0n,
          contractPaysFees: false,
        }),
      }),
      {}
    );
    expect(promptHandler).toHaveBeenNthCalledWith(2, {
      ...rpcRequest,
      type: TriggerTypes.PinConfirmationPrompt,
    }, {});
    expect(promptHandler).toHaveBeenNthCalledWith(3, {
      type: TriggerTypes.SendNanoContractTxLoadingTrigger,
    }, {});
  });

  it('should call releaseUtxos when user rejects the confirmation prompt', async () => {
    const address = 'address123';

    const mockTransaction = {
      getFeeHeader: jest.fn().mockReturnValue({ entries: [] }),
      getNanoHeaders: jest.fn().mockReturnValue([{ address: null, seqnum: 0 }]),
      prepareToSend: jest.fn(),
      toHex: jest.fn().mockReturnValue('tx-hex'),
    };
    const mockReleaseUtxos = jest.fn().mockResolvedValue(undefined);
    const mockSendTx = {
      transaction: mockTransaction,
      runFromMining: jest.fn().mockResolvedValue({ tx_id: 'mock-tx-id' }),
      releaseUtxos: mockReleaseUtxos,
    };
    (wallet.createNanoContractTransaction as jest.Mock).mockResolvedValue(mockSendTx);

    promptHandler.mockResolvedValueOnce({
      type: TriggerResponseTypes.SendNanoContractTxConfirmationResponse,
      data: {
        accepted: false,
        nc: {
          caller: address,
          method: rpcRequest.params.method,
          blueprintId: rpcRequest.params.blueprint_id,
          ncId: rpcRequest.params.nc_id,
          args: rpcRequest.params.args,
          parsedArgs: [],
          actions: [],
          pushTx: true,
          fee: 0n,
        },
      },
    });

    await expect(sendNanoContractTx(rpcRequest, wallet, {}, promptHandler)).rejects.toThrow(PromptRejectedError);

    expect(mockReleaseUtxos).toHaveBeenCalledTimes(1);
  });

  it('should call releaseUtxos when user rejects the PIN prompt', async () => {
    const address = 'address123';

    const mockTransaction = {
      getFeeHeader: jest.fn().mockReturnValue({ entries: [] }),
      getNanoHeaders: jest.fn().mockReturnValue([{ address: null, seqnum: 0 }]),
      prepareToSend: jest.fn(),
      toHex: jest.fn().mockReturnValue('tx-hex'),
    };
    const mockReleaseUtxos = jest.fn().mockResolvedValue(undefined);
    const mockSendTx = {
      transaction: mockTransaction,
      runFromMining: jest.fn().mockResolvedValue({ tx_id: 'mock-tx-id' }),
      releaseUtxos: mockReleaseUtxos,
    };
    (wallet.createNanoContractTransaction as jest.Mock).mockResolvedValue(mockSendTx);

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendNanoContractTxConfirmationResponse,
        data: {
          accepted: true,
          nc: {
            caller: address,
            method: rpcRequest.params.method,
            blueprintId: rpcRequest.params.blueprint_id,
            ncId: rpcRequest.params.nc_id,
            args: rpcRequest.params.args,
            parsedArgs: [],
            actions: [],
            pushTx: true,
            fee: 0n,
          },
        },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: false,
          pinCode: '',
        },
      });

    await expect(sendNanoContractTx(rpcRequest, wallet, {}, promptHandler)).rejects.toThrow(PromptRejectedError);

    expect(mockReleaseUtxos).toHaveBeenCalledTimes(1);
  });

  it('should call releaseUtxos when runFromMining fails', async () => {
    const address = 'address123';
    const pinCode = '1234';

    const mockTransaction = {
      getFeeHeader: jest.fn().mockReturnValue({ entries: [] }),
      getNanoHeaders: jest.fn().mockReturnValue([{ address: null, seqnum: 0 }]),
      prepareToSend: jest.fn(),
      toHex: jest.fn().mockReturnValue('tx-hex'),
    };
    const mockReleaseUtxos = jest.fn().mockResolvedValue(undefined);
    const mockSendTx = {
      transaction: mockTransaction,
      runFromMining: jest.fn().mockRejectedValue(new Error('Mining failed')),
      releaseUtxos: mockReleaseUtxos,
    };
    (wallet.createNanoContractTransaction as jest.Mock).mockResolvedValue(mockSendTx);

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendNanoContractTxConfirmationResponse,
        data: {
          accepted: true,
          nc: {
            caller: address,
            method: rpcRequest.params.method,
            blueprintId: rpcRequest.params.blueprint_id,
            ncId: rpcRequest.params.nc_id,
            args: rpcRequest.params.args,
            parsedArgs: [],
            actions: [],
            pushTx: true,
            fee: 0n,
          },
        },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: true,
          pinCode,
        },
      });

    await expect(sendNanoContractTx(rpcRequest, wallet, {}, promptHandler)).rejects.toThrow(SendNanoContractTxError);

    expect(mockReleaseUtxos).toHaveBeenCalledTimes(1);
  });
});

describe('fee pre-calculation', () => {
  let wallet: IHathorWallet;
  let promptHandler: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    promptHandler = jest.fn();
  });

  it('should include fees in confirmation prompt', async () => {
    const mockFees = [{ tokenIndex: 0, amount: 100n }];
    const mockTransaction = {
      getFeeHeader: jest.fn().mockReturnValue({ entries: mockFees }),
      toHex: jest.fn().mockReturnValue('tx-hex'),
    };

    wallet = {
      createAndSendNanoContractTransaction: jest.fn(),
      createNanoContractTransaction: jest.fn().mockResolvedValue({
        transaction: mockTransaction,
        releaseUtxos: jest.fn().mockResolvedValue(undefined),
      }),
      getServerUrl: jest.fn(),
      getTokenDetails: jest.fn().mockResolvedValue({
        tokenInfo: { name: 'Test Token', symbol: 'TST', uid: 'test-token-uid' },
      }),
      getAddressAtIndex: jest.fn().mockResolvedValue('temp-address'),
    } as Partial<IHathorWallet> as IHathorWallet;

    let capturedPrompt: SendNanoContractTxConfirmationPrompt | undefined;
    promptHandler.mockImplementation((prompt: SendNanoContractTxConfirmationPrompt) => {
      if (prompt.type === TriggerTypes.SendNanoContractTxConfirmationPrompt) {
        capturedPrompt = prompt;
        return { data: { accepted: false } }; // Reject to end early
      }
    });

    const rpcRequest = {
      method: RpcMethods.SendNanoContractTx,
      id: '1',
      jsonrpc: '2.0',
      params: {
        network: 'mainnet',
        method: 'initialize',
        blueprint_id: 'blueprint123',
        nc_id: 'nc123',
        actions: [{ type: 'deposit', address: 'test-address', token: '00', amount: '100' }] as unknown as NanoContractAction[],
        args: [],
        push_tx: true,
      }
    } as SendNanoContractRpcRequest;

    await expect(sendNanoContractTx(rpcRequest, wallet, {}, promptHandler)).rejects.toThrow();

    expect(capturedPrompt!.data.fee).toBe(100n);
    expect(wallet.createNanoContractTransaction).toHaveBeenCalledWith(
      expect.anything(),
      'temp-address',
      expect.anything(),
      expect.objectContaining({ signTx: false })
    );
  });

  it('should pre-build with temporary caller and signTx=false', async () => {
    const mockTransaction = {
      getFeeHeader: jest.fn().mockReturnValue({ entries: [] }),
      toHex: jest.fn().mockReturnValue('tx-hex'),
    };

    wallet = {
      createAndSendNanoContractTransaction: jest.fn(),
      createNanoContractTransaction: jest.fn().mockResolvedValue({
        transaction: mockTransaction,
        releaseUtxos: jest.fn().mockResolvedValue(undefined),
      }),
      getServerUrl: jest.fn(),
      getTokenDetails: jest.fn().mockResolvedValue({
        tokenInfo: { name: 'Test Token', symbol: 'TST', uid: 'test-token-uid' },
      }),
      getAddressAtIndex: jest.fn().mockResolvedValue('temp-caller-address'),
    } as Partial<IHathorWallet> as IHathorWallet;

    promptHandler.mockResolvedValueOnce({
      type: TriggerResponseTypes.SendNanoContractTxConfirmationResponse,
      data: { accepted: false },
    });

    const rpcRequest = {
      method: RpcMethods.SendNanoContractTx,
      id: '1',
      jsonrpc: '2.0',
      params: {
        network: 'mainnet',
        method: 'initialize',
        blueprint_id: 'blueprint123',
        nc_id: null,
        actions: [] as NanoContractAction[],
        args: [],
        push_tx: true,
      }
    } as SendNanoContractRpcRequest;

    await expect(sendNanoContractTx(rpcRequest, wallet, {}, promptHandler)).rejects.toThrow();

    // Verify pre-build was called with temp caller and signTx: false
    expect(wallet.getAddressAtIndex).toHaveBeenCalledWith(0);
    expect(wallet.createNanoContractTransaction).toHaveBeenCalledWith(
      'initialize',
      'temp-caller-address',
      expect.objectContaining({
        ncId: null,
        blueprintId: 'blueprint123',
      }),
      expect.objectContaining({
        signTx: false,
      })
    );
  });
});

describe('sendNanoContractTx parameter validation', () => {
  const createMockWallet = () => {
    const mockTransaction = {
      toHex: jest.fn().mockReturnValue('tx-hex'),
      getFeeHeader: jest.fn().mockReturnValue({ entries: [] }),
      getNanoHeaders: jest.fn().mockReturnValue([{ address: null, seqnum: 0 }]),
      prepareToSend: jest.fn(),
    };
    return {
      createAndSendNanoContractTransaction: jest.fn(),
      createNanoContractTransaction: jest.fn().mockImplementation(() => ({
        transaction: mockTransaction,
        runFromMining: jest.fn().mockResolvedValue({ tx_id: 'mock-tx-id' }),
        releaseUtxos: jest.fn().mockResolvedValue(undefined),
      })),
      getServerUrl: jest.fn(),
      getFullTxById: jest.fn().mockImplementation(() => ({
        tx: {
          nc_id: 'nc-id'
        },
      })),
      getAddressAtIndex: jest.fn().mockResolvedValue('temp-address'),
      getNanoHeaderSeqnum: jest.fn().mockResolvedValue(1),
      getNetworkObject: jest.fn().mockReturnValue({ name: 'mainnet' }),
      setNanoHeaderCaller: jest.fn().mockResolvedValue(undefined),
      signTx: jest.fn().mockResolvedValue(undefined),
      storage: {},
    } as unknown as IHathorWallet;
  };

  let mockWallet: IHathorWallet;

  let mockTriggerHandler: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWallet = createMockWallet();
    mockTriggerHandler = jest.fn()
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendNanoContractTxConfirmationResponse,
        data: {
          accepted: true,
          nc: {
            caller: 'test-caller',
            blueprintId: 'test-blueprint',
            ncId: null,
            actions: [] as NanoContractAction[],
            args: [] as unknown[],
            parsedArgs: [] as unknown[],
            method: 'test-method',
            pushTx: true,
            fee: 0n,
          },
        }
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: true,
          pinCode: '1234',
        }
      });
  });

  it('should reject when neither blueprint_id nor nc_id is provided', async () => {
    const invalidRequest = {
      method: RpcMethods.SendNanoContractTx,
      params: {
        network: 'mainnet',
        method: 'test-method',
        blueprint_id: '',
        nc_id: null,
        actions: [] as NanoContractAction[],
        args: [] as unknown[],
        push_tx: true,
      },
    } as SendNanoContractRpcRequest;

    await expect(
      sendNanoContractTx(invalidRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when method is missing', async () => {
    const invalidRequest = {
      method: RpcMethods.SendNanoContractTx,
      params: {
        network: 'mainnet',
        method: '',
        blueprint_id: 'test-blueprint',
        nc_id: null,
        actions: [] as NanoContractAction[],
        args: [] as unknown[],
        push_tx: true,
      },
    } as SendNanoContractRpcRequest;

    await expect(
      sendNanoContractTx(invalidRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when method is empty', async () => {
    const invalidRequest = {
      method: RpcMethods.SendNanoContractTx,
      params: {
        network: 'mainnet',
        method: '',
        blueprint_id: 'test-blueprint',
        nc_id: null,
        actions: [] as NanoContractAction[],
        args: [] as unknown[],
        push_tx: true,
      },
    } as SendNanoContractRpcRequest;

    await expect(
      sendNanoContractTx(invalidRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when actions is not an array', async () => {
    const invalidRequest = {
      method: RpcMethods.SendNanoContractTx,
      params: {
        network: 'mainnet',
        method: 'test-method',
        blueprint_id: 'test-blueprint',
        nc_id: null,
        actions: 'not-an-array' as unknown as NanoContractAction[],
        args: [] as unknown[],
        push_tx: true,
      },
    } as SendNanoContractRpcRequest;

    await expect(
      sendNanoContractTx(invalidRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when action amount is not a valid string number', async () => {
    const invalidActions = [
      {
        type: 'deposit',
        address: 'test-address',
        token: '00',
        amount: 'not-a-number', // Invalid string amount
      } as NanoContractActionWithStringAmount
    ];

    const invalidRequest = {
      method: RpcMethods.SendNanoContractTx,
      params: {
        network: 'mainnet',
        method: 'test-method',
        blueprint_id: 'test-blueprint',
        nc_id: null,
        actions: invalidActions as unknown as NanoContractAction[],
        args: [] as unknown[],
        push_tx: true,
      },
    } as SendNanoContractRpcRequest;

    await expect(
      sendNanoContractTx(invalidRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should accept valid parameters with blueprint_id', async () => {
    const validActions = [
      {
        type: 'deposit',
        address: 'test-address',
        token: '00',
        amount: '100', // Valid string amount
      } as NanoContractActionWithStringAmount
    ];

    const validRequest = {
      method: RpcMethods.SendNanoContractTx,
      params: {
        network: 'mainnet',
        method: 'test-method',
        blueprint_id: 'test-blueprint',
        nc_id: null,
        actions: validActions as unknown as NanoContractAction[],
        args: [] as unknown[],
        push_tx: true,
      },
    } as SendNanoContractRpcRequest;

    await expect(
      sendNanoContractTx(validRequest, mockWallet, {}, mockTriggerHandler)
    ).resolves.toBeDefined();
  });

  it('should accept valid parameters with nc_id', async () => {
    const promptHandler = jest.fn()
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendNanoContractTxConfirmationResponse,
        data: {
          accepted: true,
          nc: {
            caller: 'test-caller',
            blueprintId: 'test-blueprint',
            ncId: null,
            actions: [] as NanoContractAction[],
            args: [] as unknown[],
            parsedArgs: [] as unknown[],
            method: 'test-method',
            pushTx: true,
            fee: 0n,
          },
        }
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: true,
          pinCode: '1234',
        }
      });
    const validActions = [
      {
        type: 'deposit',
        address: 'test-address',
        token: '00',
        amount: '100', // Valid string amount
      } as NanoContractActionWithStringAmount
    ];

    const validRequest = {
      method: RpcMethods.SendNanoContractTx,
      params: {
        network: 'mainnet',
        method: 'test-method',
        blueprint_id: '',  // no blueprint id in the parameters
        nc_id: 'test-nc-id',
        actions: validActions as unknown as NanoContractAction[],
        args: [] as unknown[],
        push_tx: true,
      },
    } as SendNanoContractRpcRequest;

    await sendNanoContractTx(validRequest, mockWallet, {}, promptHandler);
    expect(promptHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: TriggerTypes.SendNanoContractTxConfirmationPrompt,
        data: expect.objectContaining({
          blueprintId: 'test-blueprint',  // make sure we added the blueprint id in the data object
          fee: 0n,
          contractPaysFees: false,
        }),
      }),
      {}
    );

    expect(nanoUtils.getBlueprintId).toHaveBeenCalled();
  });

  it('should use default push_tx value when not provided', async () => {
    const validActions = [
      {
        type: 'deposit',
        address: 'test-address',
        token: '00',
        amount: '100', // Valid string amount
      } as NanoContractActionWithStringAmount
    ];

    const validRequest = {
      method: RpcMethods.SendNanoContractTx,
      params: {
        network: 'mainnet',
        method: 'test-method',
        blueprint_id: 'test-blueprint',
        nc_id: null,
        actions: validActions as unknown as NanoContractAction[],
        args: [] as unknown[],
        // push_tx intentionally omitted to test default value (true)
      },
    } as SendNanoContractRpcRequest;

    await sendNanoContractTx(validRequest, mockWallet, {}, mockTriggerHandler);
    // Implementation now uses createNanoContractTransaction with signTx: false then runFromMining
    expect(mockWallet.createNanoContractTransaction).toHaveBeenCalled();
  });

  it('should call createNanoContractTransaction when push_tx is false', async () => {
    const validActions = [
      {
        type: 'deposit',
        address: 'test-address',
        token: '00',
        amount: '100', // Valid string amount
      } as NanoContractActionWithStringAmount
    ];

    const validRequest = {
      method: RpcMethods.SendNanoContractTx,
      params: {
        network: 'mainnet',
        method: 'test-method',
        blueprint_id: 'test-blueprint',
        nc_id: null,
        actions: validActions as unknown as NanoContractAction[],
        args: [] as unknown[],
        push_tx: false,
      },
    } as SendNanoContractRpcRequest;

    await sendNanoContractTx(validRequest, mockWallet, {}, mockTriggerHandler);
    expect(mockWallet.createNanoContractTransaction).toHaveBeenCalled();
  });

  it('should call return a txHex when push_tx is false', async () => {
    const validActions = [
      {
        type: 'deposit',
        address: 'test-address',
        token: '00',
        amount: '100', // Valid string amount
      } as NanoContractActionWithStringAmount
    ];

    const validRequest = {
      method: RpcMethods.SendNanoContractTx,
      params: {
        network: 'mainnet',
        method: 'test-method',
        blueprint_id: 'test-blueprint',
        nc_id: null,
        actions: validActions as unknown as NanoContractAction[],
        args: [] as unknown[],
        push_tx: false,
      },
    } as SendNanoContractRpcRequest;

    const response = await sendNanoContractTx(validRequest, mockWallet, {}, mockTriggerHandler);
    expect(mockWallet.createNanoContractTransaction).toHaveBeenCalled();
    expect(response).toStrictEqual({
      type: RpcResponseTypes.SendNanoContractTxResponse,
      response: 'tx-hex',
    });
  });

  it('should throw SendNanoContractTxError when caller is missing in confirmation response', async () => {
    const validActions = [
      {
        type: 'deposit',
        address: 'test-address',
        token: '00',
        amount: '100',
      } as NanoContractActionWithStringAmount
    ];

    const validRequest = {
      method: RpcMethods.SendNanoContractTx,
      params: {
        network: 'mainnet',
        method: 'test-method',
        blueprint_id: 'test-blueprint',
        nc_id: null,
        actions: validActions as unknown as NanoContractAction[],
        args: [] as unknown[],
        push_tx: true,
      },
    } as SendNanoContractRpcRequest;

    const promptHandler = jest.fn().mockResolvedValueOnce({
      type: TriggerResponseTypes.SendNanoContractTxConfirmationResponse,
      data: {
        accepted: true,
        nc: {
          // caller is missing
          blueprintId: 'test-blueprint',
          ncId: null,
          actions: [] as NanoContractAction[],
          args: [] as unknown[],
          parsedArgs: [] as unknown[],
          method: 'test-method',
          pushTx: true,
          fee: 0n,
        },
      }
    });

    await expect(
      sendNanoContractTx(validRequest, mockWallet, {}, promptHandler)
    ).rejects.toThrow(SendNanoContractTxError);
  });

  it('should throw SendNanoContractTxError when caller is empty string in confirmation response', async () => {
    const validActions = [
      {
        type: 'deposit',
        address: 'test-address',
        token: '00',
        amount: '100',
      } as NanoContractActionWithStringAmount
    ];

    const validRequest = {
      method: RpcMethods.SendNanoContractTx,
      params: {
        network: 'mainnet',
        method: 'test-method',
        blueprint_id: 'test-blueprint',
        nc_id: null,
        actions: validActions as unknown as NanoContractAction[],
        args: [] as unknown[],
        push_tx: true,
      },
    } as SendNanoContractRpcRequest;

    const promptHandler = jest.fn().mockResolvedValueOnce({
      type: TriggerResponseTypes.SendNanoContractTxConfirmationResponse,
      data: {
        accepted: true,
        nc: {
          caller: '',  // Empty string
          blueprintId: 'test-blueprint',
          ncId: null,
          actions: [] as NanoContractAction[],
          args: [] as unknown[],
          parsedArgs: [] as unknown[],
          method: 'test-method',
          pushTx: true,
          fee: 0n,
        },
      }
    });

    await expect(
      sendNanoContractTx(validRequest, mockWallet, {}, promptHandler)
    ).rejects.toThrow(SendNanoContractTxError);
  });
});
