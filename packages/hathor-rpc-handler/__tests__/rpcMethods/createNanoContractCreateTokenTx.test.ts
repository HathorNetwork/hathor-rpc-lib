/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IHathorWallet } from '@hathor/wallet-lib';
import type { NanoContractAction } from '@hathor/wallet-lib/lib/nano_contracts/types';
import { createNanoContractCreateTokenTx } from '../../src/rpcMethods/createNanoContractCreateTokenTx';
import {
  TriggerTypes,
  RpcMethods,
  CreateNanoContractCreateTokenTxRpcRequest,
  CreateNanoContractCreateTokenTxConfirmationPrompt,
  TriggerResponseTypes,
  RpcResponseTypes,
  TokenVersionString,
} from '../../src/types';
import { PromptRejectedError, InvalidParamsError, SendNanoContractTxError } from '../../src/errors';

describe('createNanoContractCreateTokenTx', () => {
  let rpcRequest: CreateNanoContractCreateTokenTxRpcRequest;
  let wallet: IHathorWallet;
  let promptHandler = jest.fn();

  const nanoActions = [
    {
      type: 'deposit',
      address: 'test-address',
      token: '00',
      amount: '100',
      changeAddress: 'test-change-address',
    },
  ];

  const createTokenOptions = {
    name: 'TestToken',
    symbol: 'TT',
    amount: '100',
    version: TokenVersionString.DEPOSIT,
    mintAddress: 'wallet1',
    changeAddress: 'wallet1',
    createMint: true,
    mintAuthorityAddress: 'wallet1',
    allowExternalMintAuthorityAddress: false,
    createMelt: true,
    meltAuthorityAddress: 'wallet1',
    allowExternalMeltAuthorityAddress: false,
    data: ['test'],
    contractPaysTokenDeposit: true,
  };

  type NanoData = {
    blueprint_id?: string;
    nc_id?: string;
    actions?: NanoContractAction[];
    args?: unknown[];
  };

  // Mock fees returned by pre-build transaction
  const mockFees = [{ tokenIndex: 0, amount: 100n }];

  // Create mock transaction object
  const createMockTransaction = (fees = mockFees) => ({
    getFeeHeader: jest.fn().mockReturnValue({ entries: fees }),
    getNanoHeaders: jest.fn().mockReturnValue([{ address: null, seqnum: 0 }]),
    prepareToSend: jest.fn(),
    toHex: jest.fn().mockReturnValue('mock-tx-hex'),
  });

  // Create mock SendTransaction result
  const createMockSendTransactionResult = (mockTransaction: ReturnType<typeof createMockTransaction>) => ({
    transaction: mockTransaction,
    runFromMining: jest.fn().mockResolvedValue({ tx_id: 'mock-tx-id' }),
    releaseUtxos: jest.fn().mockResolvedValue(undefined),
  });

  beforeEach(() => {
    jest.clearAllMocks();

    rpcRequest = {
      method: RpcMethods.CreateNanoContractCreateTokenTx,
      params: {
        method: 'initialize',
        address: 'wallet1',
        data: {
          blueprint_id: 'blueprint123',
          nc_id: 'nc123',
          actions: nanoActions,
          args: [],
        },
        createTokenOptions,
        push_tx: true,
      },
    };

    const mockTransaction = createMockTransaction();
    const mockSendTxResult = createMockSendTransactionResult(mockTransaction);

    wallet = {
      createNanoContractCreateTokenTransaction: jest.fn().mockResolvedValue(mockSendTxResult),
      getNanoHeaderSeqnum: jest.fn().mockResolvedValue(1),
      getNetworkObject: jest.fn().mockReturnValue({ name: 'testnet' }),
      setNanoHeaderCaller: jest.fn().mockResolvedValue(undefined),
      signTx: jest.fn().mockResolvedValue(undefined),
      storage: {
        // Mock storage for signTransaction
      },
    } as unknown as IHathorWallet;

    promptHandler = jest.fn();
  });

  it('should send a nano contract create token transaction successfully (push_tx true)', async () => {
    const pinCode = '1234';
    const response = { tx_id: 'mock-tx-id' };
    const rpcResponse = {
      type: RpcResponseTypes.CreateNanoContractCreateTokenTxResponse,
      response,
    };

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.CreateNanoContractCreateTokenTxConfirmationResponse,
        data: {
          accepted: true,
          nano: {
            blueprintId: (rpcRequest.params.data as NanoData).blueprint_id,
            ncId: (rpcRequest.params.data as NanoData).nc_id,
            actions: (rpcRequest.params.data as NanoData).actions,
            args: (rpcRequest.params.data as NanoData).args,
            method: rpcRequest.params.method,
            pushTx: true,
            caller: 'wallet1',
            fee: 100n,
            parsedArgs: [],
          },
          token: createTokenOptions,
        },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: true,
          pinCode,
        },
      });

    const result = await createNanoContractCreateTokenTx(rpcRequest, wallet, {}, promptHandler);

    expect(promptHandler).toHaveBeenCalledTimes(4); // Confirmation, PIN, Loading, LoadingFinished
    expect(promptHandler).toHaveBeenNthCalledWith(1,
      expect.objectContaining({
        type: TriggerTypes.CreateNanoContractCreateTokenTxConfirmationPrompt,
      }),
      {}
    );
    expect(promptHandler).toHaveBeenNthCalledWith(2,
      expect.objectContaining({
        type: TriggerTypes.PinConfirmationPrompt,
      }),
      {}
    );
    expect(promptHandler).toHaveBeenNthCalledWith(3,
      expect.objectContaining({
        type: TriggerTypes.CreateNanoContractCreateTokenTxLoadingTrigger,
      }),
      {}
    );
    expect(promptHandler).toHaveBeenNthCalledWith(4,
      expect.objectContaining({
        type: TriggerTypes.CreateNanoContractCreateTokenTxLoadingFinishedTrigger,
      }),
      {}
    );

    // Verify the pre-build was called with signTx: false
    expect(wallet.createNanoContractCreateTokenTransaction).toHaveBeenCalledWith(
      rpcRequest.params.method,
      rpcRequest.params.address,
      expect.objectContaining({
        blueprintId: 'blueprint123',
        ncId: 'nc123',
        args: [],
      }),
      expect.anything(),
      expect.objectContaining({ signTx: false })
    );
    expect(result).toEqual(rpcResponse);
  });

  it('should create but not send the transaction (push_tx false)', async () => {
    rpcRequest.params.push_tx = false;
    const pinCode = '1234';
    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.CreateNanoContractCreateTokenTxConfirmationResponse,
        data: {
          accepted: true,
          nano: {
            blueprintId: (rpcRequest.params.data as NanoData).blueprint_id,
            ncId: (rpcRequest.params.data as NanoData).nc_id,
            actions: (rpcRequest.params.data as NanoData).actions,
            args: (rpcRequest.params.data as NanoData).args,
            method: rpcRequest.params.method,
            pushTx: false,
            caller: 'wallet1',
            fee: 100n,
            parsedArgs: [],
          },
          token: createTokenOptions,
        },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: true,
          pinCode,
        },
      });

    const result = await createNanoContractCreateTokenTx(rpcRequest, wallet, {}, promptHandler);

    expect(promptHandler).toHaveBeenCalledTimes(4); // Confirmation, PIN, Loading, LoadingFinished
    expect(promptHandler).toHaveBeenNthCalledWith(3,
      expect.objectContaining({
        type: TriggerTypes.CreateNanoContractCreateTokenTxLoadingTrigger,
      }),
      {}
    );
    expect(promptHandler).toHaveBeenNthCalledWith(4,
      expect.objectContaining({
        type: TriggerTypes.CreateNanoContractCreateTokenTxLoadingFinishedTrigger,
      }),
      {}
    );

    // Verify the pre-build was called with signTx: false
    expect(wallet.createNanoContractCreateTokenTransaction).toHaveBeenCalledWith(
      rpcRequest.params.method,
      rpcRequest.params.address,
      expect.objectContaining({
        blueprintId: 'blueprint123',
        ncId: 'nc123',
        args: [],
      }),
      expect.objectContaining({
        name: createTokenOptions.name,
        symbol: createTokenOptions.symbol,
        contractPaysTokenDeposit: createTokenOptions.contractPaysTokenDeposit,
      }),
      expect.objectContaining({ signTx: false })
    );
    expect(result).toHaveProperty('type', RpcResponseTypes.CreateNanoContractCreateTokenTxResponse);
    expect(result).toHaveProperty('response', 'mock-tx-hex');
  });

  it('should throw PromptRejectedError if the user rejects the confirmation prompt', async () => {
    promptHandler.mockResolvedValueOnce({
      type: TriggerResponseTypes.CreateNanoContractCreateTokenTxConfirmationResponse,
      data: { accepted: false },
    });
    await expect(createNanoContractCreateTokenTx(rpcRequest, wallet, {}, promptHandler)).rejects.toThrow(PromptRejectedError);
  });

  it('should throw PromptRejectedError if the user rejects the PIN prompt', async () => {
    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.CreateNanoContractCreateTokenTxConfirmationResponse,
        data: {
          accepted: true,
          nano: {
            blueprintId: (rpcRequest.params.data as NanoData).blueprint_id,
            ncId: (rpcRequest.params.data as NanoData).nc_id,
            actions: (rpcRequest.params.data as NanoData).actions,
            args: (rpcRequest.params.data as NanoData).args,
            method: rpcRequest.params.method,
            pushTx: true,
            caller: 'wallet1',
            fee: 100n,
            parsedArgs: [],
          },
          token: createTokenOptions,
        },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: { accepted: false },
      });
    await expect(createNanoContractCreateTokenTx(rpcRequest, wallet, {}, promptHandler)).rejects.toThrow(PromptRejectedError);
  });

  it('should throw InvalidParamsError for invalid parameters', async () => {
    const invalidRequest = {
      method: RpcMethods.CreateNanoContractCreateTokenTx,
      params: {
        method: '', // Invalid: empty method
        address: '', // Invalid: empty address
        data: {},
        createTokenOptions: {},
        push_tx: true,
      },
    } as unknown as CreateNanoContractCreateTokenTxRpcRequest;
    await expect(createNanoContractCreateTokenTx(invalidRequest, wallet, {}, promptHandler)).rejects.toThrow(InvalidParamsError);
  });

  it('should validate nano contract actions using wallet-lib schema', async () => {
    const invalidActionRequest = {
      method: RpcMethods.CreateNanoContractCreateTokenTx,
      params: {
        method: 'initialize',
        address: 'wallet1',
        data: {
          blueprint_id: 'blueprint123',
          actions: [
            {
              type: 'invoke_authority',
              token: '00',
              address: 'test-address',
              // Missing required 'authority' field for invoke_authority action
            },
          ],
        },
        createTokenOptions,
        push_tx: true,
      },
    } as unknown as CreateNanoContractCreateTokenTxRpcRequest;

    await expect(createNanoContractCreateTokenTx(invalidActionRequest, wallet, {}, promptHandler)).rejects.toThrow(InvalidParamsError);
  });

  it('should validate token options using shared schema', async () => {
    const invalidTokenRequest = {
      method: RpcMethods.CreateNanoContractCreateTokenTx,
      params: {
        method: 'initialize',
        address: 'wallet1',
        data: {
          blueprint_id: 'blueprint123',
        },
        createTokenOptions: {
          name: '', // Invalid: empty name
          symbol: 'A', // Invalid: too short
          amount: '100',
        },
        push_tx: true,
      },
    } as unknown as CreateNanoContractCreateTokenTxRpcRequest;

    await expect(createNanoContractCreateTokenTx(invalidTokenRequest, wallet, {}, promptHandler)).rejects.toThrow(InvalidParamsError);
  });

  it('should include fees and preparedTx in confirmation prompt', async () => {
    const feesForTest = [{ tokenIndex: 0, amount: 200n }];
    const mockTransaction = createMockTransaction(feesForTest);
    const mockSendTxResult = createMockSendTransactionResult(mockTransaction);

    (wallet.createNanoContractCreateTokenTransaction as jest.Mock).mockResolvedValue(mockSendTxResult);

    // Capture the prompt data
    let capturedPrompt: CreateNanoContractCreateTokenTxConfirmationPrompt | undefined;
    promptHandler.mockImplementation((prompt: CreateNanoContractCreateTokenTxConfirmationPrompt) => {
      if (prompt.type === TriggerTypes.CreateNanoContractCreateTokenTxConfirmationPrompt) {
        capturedPrompt = prompt;
        return {
          type: TriggerResponseTypes.CreateNanoContractCreateTokenTxConfirmationResponse,
          data: { accepted: false },
        }; // Reject to end early
      }
    });

    await expect(createNanoContractCreateTokenTx(rpcRequest, wallet, {}, promptHandler)).rejects.toThrow(PromptRejectedError);

    // Verify fees and preparedTx are included in the prompt
    expect(capturedPrompt).toBeDefined();
    expect(capturedPrompt!.type).toBe(TriggerTypes.CreateNanoContractCreateTokenTxConfirmationPrompt);
    expect(capturedPrompt!.data.nano.fee).toBe(200n);
    expect(capturedPrompt!.data.nano.preparedTx).toBe(mockTransaction);
  });

  it('should handle transaction without fee header', async () => {
    const mockTransaction = {
      getFeeHeader: jest.fn().mockReturnValue(null), // No fee header
      getNanoHeaders: jest.fn().mockReturnValue([{ address: null, seqnum: 0 }]),
      prepareToSend: jest.fn(),
      toHex: jest.fn().mockReturnValue('mock-tx-hex'),
    };
    const mockSendTxResult = {
      transaction: mockTransaction,
      runFromMining: jest.fn().mockResolvedValue({ tx_id: 'mock-tx-id' }),
      releaseUtxos: jest.fn().mockResolvedValue(undefined),
    };

    (wallet.createNanoContractCreateTokenTransaction as jest.Mock).mockResolvedValue(mockSendTxResult);

    let capturedPrompt: CreateNanoContractCreateTokenTxConfirmationPrompt | undefined;
    promptHandler.mockImplementation((prompt: CreateNanoContractCreateTokenTxConfirmationPrompt) => {
      if (prompt.type === TriggerTypes.CreateNanoContractCreateTokenTxConfirmationPrompt) {
        capturedPrompt = prompt;
        return {
          type: TriggerResponseTypes.CreateNanoContractCreateTokenTxConfirmationResponse,
          data: { accepted: false },
        }; // Reject to end early
      }
    });

    await expect(createNanoContractCreateTokenTx(rpcRequest, wallet, {}, promptHandler)).rejects.toThrow(PromptRejectedError);

    // Should default to empty array when no fee header
    expect(capturedPrompt!.data.nano.fee).toBe(0n);
  });

  it('should call wallet.signTx with correct parameters', async () => {
    const pinCode = '1234';
    const mockTransaction = createMockTransaction();
    const mockSendTxResult = createMockSendTransactionResult(mockTransaction);

    (wallet.createNanoContractCreateTokenTransaction as jest.Mock).mockResolvedValue(mockSendTxResult);

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.CreateNanoContractCreateTokenTxConfirmationResponse,
        data: {
          accepted: true,
          nano: {
            blueprintId: (rpcRequest.params.data as NanoData).blueprint_id,
            ncId: (rpcRequest.params.data as NanoData).nc_id,
            actions: (rpcRequest.params.data as NanoData).actions,
            args: (rpcRequest.params.data as NanoData).args,
            method: rpcRequest.params.method,
            pushTx: true,
            caller: 'wallet1',
            fee: 100n,
            parsedArgs: [],
          },
          token: createTokenOptions,
        },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: true,
          pinCode,
        },
      });

    await createNanoContractCreateTokenTx(rpcRequest, wallet, {}, promptHandler);

    expect(wallet.signTx).toHaveBeenCalledWith(
      mockTransaction,
      { pinCode }
    );
  });

  it('should call runFromMining when push_tx is true', async () => {
    const pinCode = '1234';
    const mockTransaction = createMockTransaction();
    const mockSendTxResult = createMockSendTransactionResult(mockTransaction);

    (wallet.createNanoContractCreateTokenTransaction as jest.Mock).mockResolvedValue(mockSendTxResult);

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.CreateNanoContractCreateTokenTxConfirmationResponse,
        data: {
          accepted: true,
          nano: {
            blueprintId: (rpcRequest.params.data as NanoData).blueprint_id,
            ncId: (rpcRequest.params.data as NanoData).nc_id,
            actions: (rpcRequest.params.data as NanoData).actions,
            args: (rpcRequest.params.data as NanoData).args,
            method: rpcRequest.params.method,
            pushTx: true,
            caller: 'wallet1',
            fee: 100n,
            parsedArgs: [],
          },
          token: createTokenOptions,
        },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: true,
          pinCode,
        },
      });

    await createNanoContractCreateTokenTx(rpcRequest, wallet, {}, promptHandler);

    expect(mockSendTxResult.runFromMining).toHaveBeenCalled();
    expect(mockTransaction.toHex).not.toHaveBeenCalled();
  });

  it('should call toHex when push_tx is false', async () => {
    rpcRequest.params.push_tx = false;
    const pinCode = '1234';
    const mockTransaction = createMockTransaction();
    const mockSendTxResult = createMockSendTransactionResult(mockTransaction);

    (wallet.createNanoContractCreateTokenTransaction as jest.Mock).mockResolvedValue(mockSendTxResult);

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.CreateNanoContractCreateTokenTxConfirmationResponse,
        data: {
          accepted: true,
          nano: {
            blueprintId: (rpcRequest.params.data as NanoData).blueprint_id,
            ncId: (rpcRequest.params.data as NanoData).nc_id,
            actions: (rpcRequest.params.data as NanoData).actions,
            args: (rpcRequest.params.data as NanoData).args,
            method: rpcRequest.params.method,
            pushTx: false,
            caller: 'wallet1',
            fee: 100n,
            parsedArgs: [],
          },
          token: createTokenOptions,
        },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: true,
          pinCode,
        },
      });

    await createNanoContractCreateTokenTx(rpcRequest, wallet, {}, promptHandler);

    expect(mockTransaction.toHex).toHaveBeenCalled();
    expect(mockSendTxResult.runFromMining).not.toHaveBeenCalled();
  });

  it('should update caller when changed in confirmation', async () => {
    const pinCode = '1234';
    const newCaller = 'wallet2';

    // Create a mock transaction with trackable nanoHeaders
    const mockNanoHeaders = [{ address: null, seqnum: 0 }];
    const mockTransaction = {
      getFeeHeader: jest.fn().mockReturnValue({ entries: mockFees }),
      getNanoHeaders: jest.fn().mockReturnValue(mockNanoHeaders),
      prepareToSend: jest.fn(),
      toHex: jest.fn().mockReturnValue('mock-tx-hex'),
    };
    const mockSendTxResult = {
      transaction: mockTransaction,
      runFromMining: jest.fn().mockResolvedValue({ tx_id: 'mock-tx-id' }),
      releaseUtxos: jest.fn().mockResolvedValue(undefined),
    };

    (wallet.createNanoContractCreateTokenTransaction as jest.Mock).mockResolvedValue(mockSendTxResult);

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.CreateNanoContractCreateTokenTxConfirmationResponse,
        data: {
          accepted: true,
          nano: {
            blueprintId: 'blueprint123',
            ncId: 'nc123',
            actions: nanoActions,
            args: [],
            method: 'initialize',
            pushTx: true,
            caller: newCaller,  // Different from original address 'wallet1'
            parsedArgs: [],
            fee: 100n,
          },
          token: createTokenOptions,
        },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: { accepted: true, pinCode },
      });

    await createNanoContractCreateTokenTx(rpcRequest, wallet, {}, promptHandler);

    // Verify getNanoHeaders was called to get the headers to update
    expect(mockTransaction.getNanoHeaders).toHaveBeenCalled();

    // Verify setNanoHeaderCaller was called with the header and new caller
    expect(wallet.setNanoHeaderCaller).toHaveBeenCalledWith(mockNanoHeaders[0], newCaller);
  });

  it('should throw SendNanoContractTxError when caller is missing in confirmation response', async () => {
    promptHandler.mockResolvedValueOnce({
      type: TriggerResponseTypes.CreateNanoContractCreateTokenTxConfirmationResponse,
      data: {
        accepted: true,
        nano: {
          blueprintId: 'blueprint123',
          ncId: 'nc123',
          actions: nanoActions,
          args: [],
          method: 'initialize',
          pushTx: true,
          // caller is missing
          parsedArgs: [],
          fee: 100n,
        },
        token: createTokenOptions,
      },
    });

    await expect(createNanoContractCreateTokenTx(rpcRequest, wallet, {}, promptHandler))
      .rejects.toThrow(SendNanoContractTxError);
  });

  it('should throw SendNanoContractTxError when caller is empty string in confirmation response', async () => {
    promptHandler.mockResolvedValueOnce({
      type: TriggerResponseTypes.CreateNanoContractCreateTokenTxConfirmationResponse,
      data: {
        accepted: true,
        nano: {
          blueprintId: 'blueprint123',
          ncId: 'nc123',
          actions: nanoActions,
          args: [],
          method: 'initialize',
          pushTx: true,
          caller: '',  // Empty string
          parsedArgs: [],
          fee: 100n,
        },
        token: createTokenOptions,
      },
    });

    await expect(createNanoContractCreateTokenTx(rpcRequest, wallet, {}, promptHandler))
      .rejects.toThrow(SendNanoContractTxError);
  });

  it('should call releaseUtxos when user rejects the confirmation prompt', async () => {
    const mockTransaction = createMockTransaction();
    const mockSendTxResult = createMockSendTransactionResult(mockTransaction);

    (wallet.createNanoContractCreateTokenTransaction as jest.Mock).mockResolvedValue(mockSendTxResult);

    promptHandler.mockResolvedValueOnce({
      type: TriggerResponseTypes.CreateNanoContractCreateTokenTxConfirmationResponse,
      data: { accepted: false },
    });

    await expect(createNanoContractCreateTokenTx(rpcRequest, wallet, {}, promptHandler)).rejects.toThrow(PromptRejectedError);

    expect(mockSendTxResult.releaseUtxos).toHaveBeenCalledTimes(1);
  });

  it('should call releaseUtxos when user rejects the PIN prompt', async () => {
    const mockTransaction = createMockTransaction();
    const mockSendTxResult = createMockSendTransactionResult(mockTransaction);

    (wallet.createNanoContractCreateTokenTransaction as jest.Mock).mockResolvedValue(mockSendTxResult);

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.CreateNanoContractCreateTokenTxConfirmationResponse,
        data: {
          accepted: true,
          nano: {
            blueprintId: (rpcRequest.params.data as NanoData).blueprint_id,
            ncId: (rpcRequest.params.data as NanoData).nc_id,
            actions: (rpcRequest.params.data as NanoData).actions,
            args: (rpcRequest.params.data as NanoData).args,
            method: rpcRequest.params.method,
            pushTx: true,
            caller: 'wallet1',
            fee: 100n,
            parsedArgs: [],
          },
          token: createTokenOptions,
        },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: { accepted: false },
      });

    await expect(createNanoContractCreateTokenTx(rpcRequest, wallet, {}, promptHandler)).rejects.toThrow(PromptRejectedError);

    expect(mockSendTxResult.releaseUtxos).toHaveBeenCalledTimes(1);
  });

  it('should call releaseUtxos when signTx fails', async () => {
    const mockTransaction = createMockTransaction();
    const mockSendTxResult = createMockSendTransactionResult(mockTransaction);

    (wallet.createNanoContractCreateTokenTransaction as jest.Mock).mockResolvedValue(mockSendTxResult);
    (wallet.signTx as jest.Mock).mockRejectedValue(new Error('Sign failed'));

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.CreateNanoContractCreateTokenTxConfirmationResponse,
        data: {
          accepted: true,
          nano: {
            blueprintId: (rpcRequest.params.data as NanoData).blueprint_id,
            ncId: (rpcRequest.params.data as NanoData).nc_id,
            actions: (rpcRequest.params.data as NanoData).actions,
            args: (rpcRequest.params.data as NanoData).args,
            method: rpcRequest.params.method,
            pushTx: true,
            caller: 'wallet1',
            fee: 100n,
            parsedArgs: [],
          },
          token: createTokenOptions,
        },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: { accepted: true, pinCode: '1234' },
      });

    await expect(createNanoContractCreateTokenTx(rpcRequest, wallet, {}, promptHandler)).rejects.toThrow(SendNanoContractTxError);

    expect(mockSendTxResult.releaseUtxos).toHaveBeenCalledTimes(1);
  });

  it('should call releaseUtxos when runFromMining fails', async () => {
    const mockTransaction = createMockTransaction();
    const mockSendTxResult = createMockSendTransactionResult(mockTransaction);
    mockSendTxResult.runFromMining.mockRejectedValue(new Error('Mining failed'));

    (wallet.createNanoContractCreateTokenTransaction as jest.Mock).mockResolvedValue(mockSendTxResult);

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.CreateNanoContractCreateTokenTxConfirmationResponse,
        data: {
          accepted: true,
          nano: {
            blueprintId: (rpcRequest.params.data as NanoData).blueprint_id,
            ncId: (rpcRequest.params.data as NanoData).nc_id,
            actions: (rpcRequest.params.data as NanoData).actions,
            args: (rpcRequest.params.data as NanoData).args,
            method: rpcRequest.params.method,
            pushTx: true,
            caller: 'wallet1',
            fee: 100n,
            parsedArgs: [],
          },
          token: createTokenOptions,
        },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: { accepted: true, pinCode: '1234' },
      });

    await expect(createNanoContractCreateTokenTx(rpcRequest, wallet, {}, promptHandler)).rejects.toThrow(SendNanoContractTxError);

    expect(mockSendTxResult.releaseUtxos).toHaveBeenCalledTimes(1);
  });

  it('should default to DEPOSIT version when createTokenOptions.version is not provided', async () => {
    const pinCode = '1234';

    const requestWithoutVersion = {
      ...rpcRequest,
      params: {
        ...rpcRequest.params,
        createTokenOptions: {
          ...createTokenOptions,
          version: undefined,
        },
      },
    };

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.CreateNanoContractCreateTokenTxConfirmationResponse,
        data: {
          accepted: true,
          nano: {
            blueprintId: 'blueprint123',
            ncId: 'nc123',
            actions: nanoActions,
            args: [],
            method: 'initialize',
            pushTx: true,
            caller: 'wallet1',
            fee: 100n,
            parsedArgs: [],
          },
          token: { ...createTokenOptions, version: undefined },
        },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: { accepted: true, pinCode },
      });

    await createNanoContractCreateTokenTx(requestWithoutVersion, wallet, {}, promptHandler);

    // Verify the pre-build was called with DEPOSIT version (default)
    expect(wallet.createNanoContractCreateTokenTransaction).toHaveBeenCalledWith(
      requestWithoutVersion.params.method,
      requestWithoutVersion.params.address,
      expect.anything(),
      expect.objectContaining({
        version: 1, // TokenVersion.DEPOSIT
      }),
      expect.anything()
    );
  });
});
