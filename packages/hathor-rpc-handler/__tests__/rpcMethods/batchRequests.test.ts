/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from '@hathor/wallet-lib';
import { batchRequests } from '../../src/rpcMethods/batchRequests';
import {
  RpcMethods,
  BatchRequestsRpcRequest,
  TriggerTypes,
  TriggerResponseTypes,
  RpcResponseTypes,
  BatchRequestsResponse,
} from '../../src/types';
import {
  InvalidParamsError,
  PromptRejectedError,
} from '../../src/errors';

describe('batchRequests', () => {
  let wallet: jest.Mocked<HathorWallet>;
  let promptHandler: jest.Mock;

  beforeEach(() => {
    // Mock wallet
    wallet = {
      getNetwork: jest.fn().mockReturnValue('testnet'),
      sendManyOutputsSendTransaction: jest.fn(),
      createNewToken: jest.fn(),
      signMessageWithAddress: jest.fn(),
      getAddressAtIndex: jest.fn().mockResolvedValue('testAddress'),
      getAddressPathForIndex: jest.fn().mockResolvedValue('m/44\'/280\'/0\'/0/0'),
      getCurrentAddress: jest.fn().mockResolvedValue({
        address: 'testAddress',
        index: 0,
        addressPath: 'm/44\'/280\'/0\'/0/0',
      }),
      getBalance: jest.fn().mockResolvedValue([{
        token: { id: '00', name: 'Hathor', symbol: 'HTR' },
        balance: { unlocked: 100n, locked: 0n },
      }]),
      getUtxos: jest.fn().mockResolvedValue({
        total_amount_available: 100n,
        total_utxos_available: 1n,
        total_amount_locked: 0n,
        total_utxos_locked: 0n,
        utxos: [],
      }),
    } as unknown as jest.Mocked<HathorWallet>;

    // Mock prompt handler
    promptHandler = jest.fn();
  });

  describe('schema validation', () => {
    it('should reject empty batch requests', async () => {
      const rpcRequest: any = {
        method: RpcMethods.BatchRequests,
        params: {
          network: 'testnet',
          requests: [],
        },
      };

      await expect(
        batchRequests(rpcRequest, wallet, {}, promptHandler)
      ).rejects.toThrow(InvalidParamsError);
    });

    it('should reject batch with more than 20 operations', async () => {
      const rpcRequest: any = {
        method: RpcMethods.BatchRequests,
        params: {
          network: 'testnet',
          requests: Array(21).fill({
            id: 'op',
            method: RpcMethods.GetAddress,
            params: { network: 'testnet', type: 'first_empty' },
          }),
        },
      };

      await expect(
        batchRequests(rpcRequest, wallet, {}, promptHandler)
      ).rejects.toThrow(InvalidParamsError);
    });

    it('should reject batch with inconsistent networks', async () => {
      const rpcRequest: BatchRequestsRpcRequest = {
        method: RpcMethods.BatchRequests,
        params: {
          network: 'testnet',
          requests: [
            {
              id: 'op1',
              method: RpcMethods.GetAddress,
              params: { network: 'mainnet', type: 'first_empty' },
            },
          ],
        },
      };

      await expect(
        batchRequests(rpcRequest, wallet, {}, promptHandler)
      ).rejects.toThrow(InvalidParamsError);
    });

    it('should reject batch with invalid operation parameters', async () => {
      const rpcRequest: BatchRequestsRpcRequest = {
        method: RpcMethods.BatchRequests,
        params: {
          network: 'testnet',
          requests: [
            {
              id: 'op1',
              method: RpcMethods.SendTransaction,
              params: {
                network: 'testnet',
                outputs: [], // Invalid: empty outputs
              },
            },
          ],
        },
      };

      await expect(
        batchRequests(rpcRequest, wallet, {}, promptHandler)
      ).rejects.toThrow(InvalidParamsError);
    });
  });

  describe('user approval', () => {
    it('should reject if user rejects batch confirmation', async () => {
      const rpcRequest: BatchRequestsRpcRequest = {
        method: RpcMethods.BatchRequests,
        params: {
          network: 'testnet',
          requests: [
            {
              id: 'get-address',
              method: RpcMethods.GetAddress,
              params: { network: 'testnet', type: 'first_empty' },
            },
          ],
        },
      };

      promptHandler.mockResolvedValueOnce({
        type: TriggerResponseTypes.BatchRequestsConfirmationResponse,
        data: { accepted: false },
      });

      await expect(
        batchRequests(rpcRequest, wallet, {}, promptHandler)
      ).rejects.toThrow(PromptRejectedError);
    });

    it('should reject if user rejects PIN prompt', async () => {
      wallet.sendManyOutputsSendTransaction = jest.fn().mockResolvedValue({
        prepareTxData: jest.fn().mockResolvedValue({
          inputs: [],
          outputs: [{ address: 'addr', value: 100n, token: '00' }],
        }),
        run: jest.fn(),
      });

      const rpcRequest: BatchRequestsRpcRequest = {
        method: RpcMethods.BatchRequests,
        params: {
          network: 'testnet',
          requests: [
            {
              id: 'send-tx',
              method: RpcMethods.SendTransaction,
              params: {
                network: 'testnet',
                outputs: [{ address: 'addr', value: '100', token: '00' }],
              },
            },
          ],
        },
      };

      promptHandler
        .mockResolvedValueOnce({
          type: TriggerResponseTypes.BatchRequestsConfirmationResponse,
          data: { accepted: true },
        })
        .mockResolvedValueOnce({
          type: TriggerResponseTypes.PinRequestResponse,
          data: { accepted: false },
        });

      await expect(
        batchRequests(rpcRequest, wallet, {}, promptHandler)
      ).rejects.toThrow(PromptRejectedError);
    });
  });

  describe('read-only batch (no PIN required)', () => {
    it('should execute read operations without requesting PIN', async () => {
      const rpcRequest: BatchRequestsRpcRequest = {
        method: RpcMethods.BatchRequests,
        params: {
          network: 'testnet',
          errorHandling: 'fail-fast',
          requests: [
            {
              id: 'get-address',
              method: RpcMethods.GetAddress,
              params: { network: 'testnet', type: 'first_empty' },
            },
            {
              id: 'get-balance',
              method: RpcMethods.GetBalance,
              params: { network: 'testnet', tokens: ['00'] },
            },
          ],
        },
      };

      promptHandler.mockResolvedValueOnce({
        type: TriggerResponseTypes.BatchRequestsConfirmationResponse,
        data: { accepted: true },
      });

      const response = await batchRequests(rpcRequest, wallet, {}, promptHandler);

      // Should only call batch confirmation, not PIN prompt
      expect(promptHandler).toHaveBeenCalledTimes(5); // confirm + initial loading + 2x operation loading + loading finished
      expect(promptHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TriggerTypes.BatchRequestsConfirmationPrompt,
        }),
        {}
      );
      expect(promptHandler).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: TriggerTypes.PinConfirmationPrompt,
        }),
        {}
      );

      expect(response.type).toBe(RpcResponseTypes.BatchRequestsResponse);
      const batchResponse = response as BatchRequestsResponse;
      expect(batchResponse.response.status).toBe('success');
      expect(batchResponse.response.results).toHaveLength(2);
      expect(batchResponse.response.results[0].status).toBe('success');
      expect(batchResponse.response.results[1].status).toBe('success');
    });
  });

  describe('write operations batch (PIN required)', () => {
    it('should execute write operations with single PIN entry', async () => {
      const txResponse = { hash: 'txHash123' };
      const signResponse = 'signature123';

      wallet.sendManyOutputsSendTransaction = jest.fn().mockResolvedValue({
        prepareTxData: jest.fn().mockResolvedValue({
          inputs: [],
          outputs: [{ address: 'addr', value: 100n, token: '00' }],
        }),
        run: jest.fn().mockResolvedValue(txResponse),
      });

      wallet.signMessageWithAddress = jest.fn().mockResolvedValue(signResponse);

      const rpcRequest: BatchRequestsRpcRequest = {
        method: RpcMethods.BatchRequests,
        params: {
          network: 'testnet',
          errorHandling: 'fail-fast',
          requests: [
            {
              id: 'send-tx',
              method: RpcMethods.SendTransaction,
              params: {
                network: 'testnet',
                outputs: [{ address: 'addr', value: '100', token: '00' }],
              },
            },
            {
              id: 'sign-msg',
              method: RpcMethods.SignWithAddress,
              params: {
                network: 'testnet',
                message: 'test message',
                addressIndex: 0,
              },
            },
          ],
        },
      };

      const pinCode = '123456';
      promptHandler
        .mockResolvedValueOnce({
          type: TriggerResponseTypes.BatchRequestsConfirmationResponse,
          data: { accepted: true },
        })
        .mockResolvedValueOnce({
          type: TriggerResponseTypes.PinRequestResponse,
          data: { accepted: true, pinCode },
        });

      const response = await batchRequests(rpcRequest, wallet, {}, promptHandler);

      expect(response.type).toBe(RpcResponseTypes.BatchRequestsResponse);
      const batchResponse = response as BatchRequestsResponse;
      expect(batchResponse.response.status).toBe('success');
      expect(batchResponse.response.results).toHaveLength(2);
      expect(batchResponse.response.results[0].id).toBe('send-tx');
      expect(batchResponse.response.results[0].status).toBe('success');
      expect(batchResponse.response.results[1].id).toBe('sign-msg');
      expect(batchResponse.response.results[1].status).toBe('success');

      // Verify PIN was only requested once
      expect(promptHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TriggerTypes.PinConfirmationPrompt,
        }),
        {}
      );
    });
  });

  describe('mixed read and write operations', () => {
    it('should request PIN once for batch with mixed operations', async () => {
      wallet.sendManyOutputsSendTransaction = jest.fn().mockResolvedValue({
        prepareTxData: jest.fn().mockResolvedValue({
          inputs: [],
          outputs: [{ address: 'addr', value: 100n, token: '00' }],
        }),
        run: jest.fn().mockResolvedValue({ hash: 'txHash' }),
      });

      const rpcRequest: BatchRequestsRpcRequest = {
        method: RpcMethods.BatchRequests,
        params: {
          network: 'testnet',
          requests: [
            {
              id: 'get-balance',
              method: RpcMethods.GetBalance,
              params: { network: 'testnet', tokens: ['00'] },
            },
            {
              id: 'send-tx',
              method: RpcMethods.SendTransaction,
              params: {
                network: 'testnet',
                outputs: [{ address: 'addr', value: '100' }],
              },
            },
          ],
        },
      };

      promptHandler
        .mockResolvedValueOnce({
          type: TriggerResponseTypes.BatchRequestsConfirmationResponse,
          data: { accepted: true },
        })
        .mockResolvedValueOnce({
          type: TriggerResponseTypes.PinRequestResponse,
          data: { accepted: true, pinCode: '123456' },
        });

      const response = await batchRequests(rpcRequest, wallet, {}, promptHandler);

      expect(response.type).toBe(RpcResponseTypes.BatchRequestsResponse);
      const batchResponse = response as BatchRequestsResponse;
      expect(batchResponse.response.status).toBe('success');
      expect(batchResponse.response.results).toHaveLength(2);
      expect(batchResponse.response.results[0].status).toBe('success');
      expect(batchResponse.response.results[1].status).toBe('success');
    });
  });

  describe('error handling: fail-fast', () => {
    it('should stop at first error and mark remaining as skipped', async () => {
      // Create mocks that return the same object for both preparation and execution
      const tx1Mock = {
        prepareTxData: jest.fn().mockResolvedValue({
          inputs: [],
          outputs: [{ address: 'addr1', value: 100n, token: '00' }],
        }),
        run: jest.fn().mockResolvedValue({ hash: 'tx1' }),
      };
      const tx2Mock = {
        prepareTxData: jest.fn().mockResolvedValue({
          inputs: [],
          outputs: [{ address: 'addr2', value: 100n, token: '00' }],
        }),
        run: jest.fn().mockRejectedValue(new Error('Insufficient funds')),
      };
      const tx3Mock = {
        prepareTxData: jest.fn().mockResolvedValue({
          inputs: [],
          outputs: [{ address: 'addr3', value: 100n, token: '00' }],
        }),
        run: jest.fn().mockResolvedValue({ hash: 'tx3' }),
      };

      wallet.sendManyOutputsSendTransaction = jest.fn()
        .mockResolvedValueOnce(tx1Mock)  // tx1 preparation
        .mockResolvedValueOnce(tx2Mock)  // tx2 preparation
        .mockResolvedValueOnce(tx3Mock)  // tx3 preparation
        .mockResolvedValueOnce(tx1Mock)  // tx1 execution
        .mockResolvedValueOnce(tx2Mock); // tx2 execution (fails, so tx3 never executes)

      const rpcRequest: BatchRequestsRpcRequest = {
        method: RpcMethods.BatchRequests,
        params: {
          network: 'testnet',
          errorHandling: 'fail-fast',
          requests: [
            {
              id: 'tx1',
              method: RpcMethods.SendTransaction,
              params: {
                network: 'testnet',
                outputs: [{ address: 'addr1', value: '100' }],
              },
            },
            {
              id: 'tx2',
              method: RpcMethods.SendTransaction,
              params: {
                network: 'testnet',
                outputs: [{ address: 'addr2', value: '100' }],
              },
            },
            {
              id: 'tx3',
              method: RpcMethods.SendTransaction,
              params: {
                network: 'testnet',
                outputs: [{ address: 'addr3', value: '100' }],
              },
            },
          ],
        },
      };

      promptHandler
        .mockResolvedValueOnce({
          type: TriggerResponseTypes.BatchRequestsConfirmationResponse,
          data: { accepted: true },
        })
        .mockResolvedValueOnce({
          type: TriggerResponseTypes.PinRequestResponse,
          data: { accepted: true, pinCode: '123456' },
        });

      const response = await batchRequests(rpcRequest, wallet, {}, promptHandler);

      expect(response.type).toBe(RpcResponseTypes.BatchRequestsResponse);
      const batchResponse = response as BatchRequestsResponse;
      expect(batchResponse.response.status).toBe('partial-success'); // tx1 succeeded, tx2 failed, tx3 skipped
      expect(batchResponse.response.results).toHaveLength(3);
      expect(batchResponse.response.results[0].status).toBe('success');
      expect(batchResponse.response.results[1].status).toBe('failed');
      expect(batchResponse.response.results[1].error).toBeDefined();
      expect(batchResponse.response.results[2].status).toBe('skipped');
    });
  });

  describe('error handling: continue-on-error', () => {
    it('should continue executing operations after error', async () => {
      // Create mocks that return the same object for both preparation and execution
      const tx1Mock = {
        prepareTxData: jest.fn().mockResolvedValue({
          inputs: [],
          outputs: [{ address: 'addr1', value: 100n, token: '00' }],
        }),
        run: jest.fn().mockResolvedValue({ hash: 'tx1' }),
      };
      const tx2Mock = {
        prepareTxData: jest.fn().mockResolvedValue({
          inputs: [],
          outputs: [{ address: 'addr2', value: 100n, token: '00' }],
        }),
        run: jest.fn().mockRejectedValue(new Error('Insufficient funds')),
      };
      const tx3Mock = {
        prepareTxData: jest.fn().mockResolvedValue({
          inputs: [],
          outputs: [{ address: 'addr3', value: 100n, token: '00' }],
        }),
        run: jest.fn().mockResolvedValue({ hash: 'tx3' }),
      };

      wallet.sendManyOutputsSendTransaction = jest.fn()
        .mockResolvedValueOnce(tx1Mock)  // tx1 preparation
        .mockResolvedValueOnce(tx2Mock)  // tx2 preparation
        .mockResolvedValueOnce(tx3Mock)  // tx3 preparation
        .mockResolvedValueOnce(tx1Mock)  // tx1 execution
        .mockResolvedValueOnce(tx2Mock)  // tx2 execution (fails)
        .mockResolvedValueOnce(tx3Mock); // tx3 execution (continues despite tx2 failure)

      const rpcRequest: BatchRequestsRpcRequest = {
        method: RpcMethods.BatchRequests,
        params: {
          network: 'testnet',
          errorHandling: 'continue-on-error',
          requests: [
            {
              id: 'tx1',
              method: RpcMethods.SendTransaction,
              params: {
                network: 'testnet',
                outputs: [{ address: 'addr1', value: '100' }],
              },
            },
            {
              id: 'tx2',
              method: RpcMethods.SendTransaction,
              params: {
                network: 'testnet',
                outputs: [{ address: 'addr2', value: '100' }],
              },
            },
            {
              id: 'tx3',
              method: RpcMethods.SendTransaction,
              params: {
                network: 'testnet',
                outputs: [{ address: 'addr3', value: '100' }],
              },
            },
          ],
        },
      };

      promptHandler
        .mockResolvedValueOnce({
          type: TriggerResponseTypes.BatchRequestsConfirmationResponse,
          data: { accepted: true },
        })
        .mockResolvedValueOnce({
          type: TriggerResponseTypes.PinRequestResponse,
          data: { accepted: true, pinCode: '123456' },
        });

      const response = await batchRequests(rpcRequest, wallet, {}, promptHandler);

      expect(response.type).toBe(RpcResponseTypes.BatchRequestsResponse);
      const batchResponse = response as BatchRequestsResponse;
      expect(batchResponse.response.status).toBe('partial-success');
      expect(batchResponse.response.results).toHaveLength(3);
      expect(batchResponse.response.results[0].status).toBe('success');
      expect(batchResponse.response.results[1].status).toBe('failed');
      expect(batchResponse.response.results[1].error).toBeDefined();
      expect(batchResponse.response.results[2].status).toBe('success');
    });
  });

  describe('loading triggers', () => {
    it('should emit loading triggers during execution', async () => {
      const rpcRequest: BatchRequestsRpcRequest = {
        method: RpcMethods.BatchRequests,
        params: {
          network: 'testnet',
          requests: [
            {
              id: 'op1',
              method: RpcMethods.GetAddress,
              params: { network: 'testnet', type: 'first_empty' },
            },
            {
              id: 'op2',
              method: RpcMethods.GetBalance,
              params: { network: 'testnet', tokens: ['00'] },
            },
          ],
        },
      };

      promptHandler.mockResolvedValueOnce({
        type: TriggerResponseTypes.BatchRequestsConfirmationResponse,
        data: { accepted: true },
      });

      await batchRequests(rpcRequest, wallet, {}, promptHandler);

      // Should have emitted loading triggers
      expect(promptHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TriggerTypes.BatchRequestsLoadingTrigger,
          data: expect.objectContaining({
            total: 2,
            current: expect.any(Number),
            currentOperation: expect.any(String),
          }),
        }),
        {}
      );

      expect(promptHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TriggerTypes.BatchRequestsLoadingFinishedTrigger,
        }),
        {}
      );
    });
  });

  describe('overall status calculation', () => {
    it('should return "success" when all operations succeed', async () => {
      const rpcRequest: BatchRequestsRpcRequest = {
        method: RpcMethods.BatchRequests,
        params: {
          network: 'testnet',
          requests: [
            {
              id: 'op1',
              method: RpcMethods.GetAddress,
              params: { network: 'testnet', type: 'first_empty' },
            },
          ],
        },
      };

      promptHandler.mockResolvedValueOnce({
        type: TriggerResponseTypes.BatchRequestsConfirmationResponse,
        data: { accepted: true },
      });

      const response = await batchRequests(rpcRequest, wallet, {}, promptHandler);

      expect(response.type).toBe(RpcResponseTypes.BatchRequestsResponse);
      const batchResponse = response as BatchRequestsResponse;
      expect(batchResponse.response.status).toBe('success');
    });

    it('should return "failed" when all operations fail or are skipped', async () => {
      wallet.sendManyOutputsSendTransaction = jest.fn().mockResolvedValue({
        prepareTxData: jest.fn().mockResolvedValue({
          inputs: [],
          outputs: [{ address: 'addr', value: 100n, token: '00' }],
        }),
        run: jest.fn().mockRejectedValue(new Error('Failed')),
      });

      const rpcRequest: BatchRequestsRpcRequest = {
        method: RpcMethods.BatchRequests,
        params: {
          network: 'testnet',
          errorHandling: 'fail-fast',
          requests: [
            {
              id: 'tx1',
              method: RpcMethods.SendTransaction,
              params: {
                network: 'testnet',
                outputs: [{ address: 'addr', value: '100' }],
              },
            },
          ],
        },
      };

      promptHandler
        .mockResolvedValueOnce({
          type: TriggerResponseTypes.BatchRequestsConfirmationResponse,
          data: { accepted: true },
        })
        .mockResolvedValueOnce({
          type: TriggerResponseTypes.PinRequestResponse,
          data: { accepted: true, pinCode: '123456' },
        });

      const response = await batchRequests(rpcRequest, wallet, {}, promptHandler);

      expect(response.type).toBe(RpcResponseTypes.BatchRequestsResponse);
      const batchResponse = response as BatchRequestsResponse;
      expect(batchResponse.response.status).toBe('failed');
    });

    it('should return "partial-success" when some operations succeed', async () => {
      // Create mocks that return the same object for both preparation and execution
      const tx1Mock = {
        prepareTxData: jest.fn().mockResolvedValue({
          inputs: [],
          outputs: [{ address: 'addr1', value: 100n, token: '00' }],
        }),
        run: jest.fn().mockResolvedValue({ hash: 'tx1' }),
      };
      const tx2Mock = {
        prepareTxData: jest.fn().mockResolvedValue({
          inputs: [],
          outputs: [{ address: 'addr2', value: 100n, token: '00' }],
        }),
        run: jest.fn().mockRejectedValue(new Error('Failed')),
      };

      wallet.sendManyOutputsSendTransaction = jest.fn()
        .mockResolvedValueOnce(tx1Mock)  // tx1 preparation
        .mockResolvedValueOnce(tx2Mock)  // tx2 preparation
        .mockResolvedValueOnce(tx1Mock)  // tx1 execution
        .mockResolvedValueOnce(tx2Mock); // tx2 execution (fails)

      const rpcRequest: BatchRequestsRpcRequest = {
        method: RpcMethods.BatchRequests,
        params: {
          network: 'testnet',
          errorHandling: 'continue-on-error',
          requests: [
            {
              id: 'tx1',
              method: RpcMethods.SendTransaction,
              params: {
                network: 'testnet',
                outputs: [{ address: 'addr1', value: '100' }],
              },
            },
            {
              id: 'tx2',
              method: RpcMethods.SendTransaction,
              params: {
                network: 'testnet',
                outputs: [{ address: 'addr2', value: '100' }],
              },
            },
          ],
        },
      };

      promptHandler
        .mockResolvedValueOnce({
          type: TriggerResponseTypes.BatchRequestsConfirmationResponse,
          data: { accepted: true },
        })
        .mockResolvedValueOnce({
          type: TriggerResponseTypes.PinRequestResponse,
          data: { accepted: true, pinCode: '123456' },
        });

      const response = await batchRequests(rpcRequest, wallet, {}, promptHandler);

      expect(response.type).toBe(RpcResponseTypes.BatchRequestsResponse);
      const batchResponse = response as BatchRequestsResponse;
      expect(batchResponse.response.status).toBe('partial-success');
    });
  });
});
