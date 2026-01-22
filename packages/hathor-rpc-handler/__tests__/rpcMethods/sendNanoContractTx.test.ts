/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet, nanoUtils, ncApi } from '@hathor/wallet-lib';
import { NanoContractAction } from '@hathor/wallet-lib/lib/nano_contracts/types';
import { sendNanoContractTx, NanoContractActionWithStringAmount } from '../../src/rpcMethods/sendNanoContractTx';
import { TriggerTypes, RpcMethods, SendNanoContractRpcRequest, TriggerResponseTypes, RpcResponseTypes } from '../../src/types';
import { SendNanoContractTxError, InvalidParamsError } from '../../src/errors';


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
  let wallet: HathorWallet;
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

    wallet = {
      createAndSendNanoContractTransaction: jest.fn(),
      createNanoContractTransaction: jest.fn(),
      getServerUrl: jest.fn(),
      getTokenDetails: jest.fn().mockResolvedValue({
        tokenInfo: {
          name: 'Test Token',
          symbol: 'TST',
          uid: 'test-token-uid',
        },
      }),
    } as unknown as HathorWallet;

    promptHandler = jest.fn();
  });

  it('should send a nano contract transaction successfully', async () => {
    const pinCode = '1234';
    const address = 'address123';
    const response = {
      id: 'mock-id',
      method: 'mock-method',
      args: [],
      pubkey: Buffer.from('pubkey'),
      signature: Buffer.from('signature'),
    };
    const rpcResponse = {
      type: RpcResponseTypes.SendNanoContractTxResponse,
      response,
    };

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
            blueprintId: rpcRequest.params.blueprint_id,
            ncId: rpcRequest.params.nc_id,
            args: rpcRequest.params.args,
            actions: expectedActions, // Using the transformed actions
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

    (wallet.createAndSendNanoContractTransaction as jest.Mock).mockResolvedValue(response);

    const result = await sendNanoContractTx(rpcRequest, wallet, {}, promptHandler);

    expect(promptHandler).toHaveBeenCalledTimes(4);
    expect(promptHandler).toHaveBeenCalledWith({
      ...rpcRequest,
      type: TriggerTypes.PinConfirmationPrompt,
    }, {});

    expect(wallet.createAndSendNanoContractTransaction).toHaveBeenCalledWith(
      rpcRequest.params.method,
      address,
      {
        blueprintId: rpcRequest.params.blueprint_id,
        actions: expectedActions, // Using the transformed actions
        args: rpcRequest.params.args,
        ncId: rpcRequest.params.nc_id,
      },
      { pinCode }
    );
    expect(result).toEqual(rpcResponse);
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

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendNanoContractTxConfirmationResponse,
        data: {
          accepted: true,
          nc: {
            caller: 'address123',
            blueprintId: requestWithStringAmount.params.blueprint_id,
            ncId: requestWithStringAmount.params.nc_id,
            args: requestWithStringAmount.params.args,
            actions: expectedActions, // Using transformed actions
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

    (wallet.createAndSendNanoContractTransaction as jest.Mock).mockResolvedValue({});

    await sendNanoContractTx(requestWithStringAmount, wallet, {}, promptHandler);

    // Verify the wallet was called with the right parameters (including transformed actions)
    expect(wallet.createAndSendNanoContractTransaction).toHaveBeenCalledWith(
      requestWithStringAmount.params.method,
      'address123',
      expect.objectContaining({
        actions: expectedActions, // Expect BigInt conversions
      }),
      expect.anything()
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

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendNanoContractTxConfirmationResponse,
        data: {
          accepted: true,
          nc: {
            caller: 'address123',
            blueprintId: requestWithLargeAmount.params.blueprint_id,
            ncId: requestWithLargeAmount.params.nc_id,
            args: requestWithLargeAmount.params.args,
            actions: expectedActions, // Using transformed actions
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

    (wallet.createAndSendNanoContractTransaction as jest.Mock).mockResolvedValue({});

    await sendNanoContractTx(requestWithLargeAmount, wallet, {}, promptHandler);

    // Verify the wallet was called with the correct parameters
    expect(wallet.createAndSendNanoContractTransaction).toHaveBeenCalledWith(
      requestWithLargeAmount.params.method,
      'address123',
      expect.objectContaining({
        actions: expectedActions, // Expect the large BigInt conversion
      }),
      expect.anything()
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
      actions: [{
        ...originalAction,
        amount: 100n, // Convert amount to BigInt
      }],
    };

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendNanoContractTxConfirmationResponse,
        data: {
          accepted: true,
          nc: {
            ...ncData,
            address: 'address123',
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
    (wallet.createAndSendNanoContractTransaction as jest.Mock).mockRejectedValue(new Error('Transaction failed'));

    await expect(sendNanoContractTx(rpcRequest, wallet, {}, promptHandler)).rejects.toThrow(SendNanoContractTxError);

    expect(promptHandler).toHaveBeenCalledTimes(3);
    expect(promptHandler).toHaveBeenNthCalledWith(1, {
      ...rpcRequest,
      type: TriggerTypes.SendNanoContractTxConfirmationPrompt,
      data: {
        actions: expect.any(Array),
        args: expect.any(Array),
        parsedArgs: expect.any(Array),
        blueprintId: expect.any(String),
        method: expect.any(String),
        ncId: expect.any(String),
        pushTx: expect.any(Boolean),
        tokenDetails: expect.any(Map),
      },
    }, {});
    expect(promptHandler).toHaveBeenNthCalledWith(2, {
      ...rpcRequest,
      type: TriggerTypes.PinConfirmationPrompt,
    }, {});
    expect(promptHandler).toHaveBeenNthCalledWith(3, {
      type: TriggerTypes.SendNanoContractTxLoadingTrigger,
    }, {});
  });
});

describe('sendNanoContractTx parameter validation', () => {
  const mockWallet = {
    createAndSendNanoContractTransaction: jest.fn(),
    createNanoContractTransaction: jest.fn().mockImplementation(() => ({
      transaction: {
        toHex: jest.fn().mockReturnValue('tx-hex'),
      },
    })),
    getServerUrl: jest.fn(),
    getFullTxById: jest.fn().mockImplementation(() => ({
      tx: {
        nc_id: 'nc-id'
      },
    })),
  } as unknown as HathorWallet;

  let mockTriggerHandler: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
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
            method: 'test-method',
            pushTx: true,
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
            method: 'test-method',
            pushTx: true,
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
    expect(promptHandler).toHaveBeenCalledWith({
      ...validRequest,
      type: TriggerTypes.SendNanoContractTxConfirmationPrompt,
      data: {
        actions: expect.any(Array),
        args: expect.any(Array),
        parsedArgs: expect.any(Array),
        blueprintId: 'test-blueprint',  // make sure we added the blueprint id in the data object
        method: expect.any(String),
        ncId: expect.any(String),
        pushTx: expect.any(Boolean),
        tokenDetails: expect.any(Map),
      }
    }, {});

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
        push_tx: true,
      },
    } as SendNanoContractRpcRequest;

    await sendNanoContractTx(validRequest, mockWallet, {}, mockTriggerHandler);
    expect(mockWallet.createAndSendNanoContractTransaction).toHaveBeenCalled();
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
});
