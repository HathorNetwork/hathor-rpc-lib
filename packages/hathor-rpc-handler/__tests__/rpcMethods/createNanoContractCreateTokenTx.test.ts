/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from '@hathor/wallet-lib';
import type { NanoContractAction } from '@hathor/wallet-lib/lib/nano_contracts/types';
import { createNanoContractCreateTokenTx } from '../../src/rpcMethods/createNanoContractCreateTokenTx';
import {
  TriggerTypes,
  RpcMethods,
  CreateNanoContractCreateTokenTxRpcRequest,
  TriggerResponseTypes,
  RpcResponseTypes,
} from '../../src/types';
import { PromptRejectedError, InvalidParamsError } from '../../src/errors';

describe('createNanoContractCreateTokenTx', () => {
  let rpcRequest: CreateNanoContractCreateTokenTxRpcRequest;
  let wallet: HathorWallet;
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
    address: 'wallet1',
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

  beforeEach(() => {
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

    wallet = {
      createAndSendNanoContractCreateTokenTransaction: jest.fn(),
      createNanoContractCreateTokenTransaction: jest.fn(),
    } as unknown as HathorWallet;

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

    (wallet.createAndSendNanoContractCreateTokenTransaction as jest.Mock).mockResolvedValue(response);

    const result = await createNanoContractCreateTokenTx(rpcRequest, wallet, {}, promptHandler);

    expect(promptHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: TriggerTypes.CreateNanoContractCreateTokenTxConfirmationPrompt,
      }),
      {}
    );
    expect(promptHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: TriggerTypes.PinConfirmationPrompt,
      }),
      {}
    );
    expect(wallet.createAndSendNanoContractCreateTokenTransaction).toHaveBeenCalledWith(
      rpcRequest.params.method,
      rpcRequest.params.address,
      expect.objectContaining({
        blueprintId: 'blueprint123',
        ncId: 'nc123',
        actions: nanoActions,
        method: rpcRequest.params.method,
        args: [],
        pushTx: true,
      }),
      createTokenOptions,
      expect.objectContaining({ pinCode })
    );
    expect(result).toEqual(rpcResponse);
  });

  it('should create but not send the transaction (push_tx false)', async () => {
    rpcRequest.params.push_tx = false;
    const pinCode = '1234';
    const response = { tx_id: 'mock-tx-id' };
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
    (wallet.createNanoContractCreateTokenTransaction as jest.Mock).mockResolvedValue(response);
    const result = await createNanoContractCreateTokenTx(rpcRequest, wallet, {}, promptHandler);
    expect(wallet.createNanoContractCreateTokenTransaction).toHaveBeenCalledWith(
      rpcRequest.params.method,
      rpcRequest.params.address,
      expect.objectContaining({
        blueprintId: 'blueprint123',
        ncId: 'nc123',
        actions: nanoActions,
        method: rpcRequest.params.method,
        args: [],
        pushTx: false,
      }),
      createTokenOptions,
      expect.objectContaining({ pinCode })
    );
    expect(result).toHaveProperty('type', RpcResponseTypes.CreateNanoContractCreateTokenTxResponse);
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
}); 
