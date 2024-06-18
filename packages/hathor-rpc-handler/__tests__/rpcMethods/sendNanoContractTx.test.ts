/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from '@hathor/wallet-lib';
import { sendNanoContractTx } from '../../src/rpcMethods/sendNanoContractTx';
import { ConfirmationPromptTypes, RpcMethods, SendNanoContractRpcRequest } from '../../src/types';
import { SendNanoContractTxFailure } from '../../src/errors';

describe('sendNanoContractTx', () => {
  let rpcRequest: SendNanoContractRpcRequest;
  let wallet: HathorWallet;
  let promptHandler = jest.fn();

  beforeEach(() => {
    rpcRequest = {
      method: RpcMethods.SendNanoContractTx,
      id: '1',
      jsonrpc: '2.0',
      params: {
        method: 'initialize',
        blueprint_id: 'blueprint123',
        nc_id: 'nc123',
        actions: [],
        args: [],
        push_tx: true,
      }
    } as SendNanoContractRpcRequest;

    wallet = {
      createAndSendNanoContractTransaction: jest.fn(),
      createNanoContractTransaction: jest.fn(),
    } as unknown as HathorWallet;

    promptHandler = jest.fn();
  });

  it('should send a nano contract transaction successfully', async () => {
    const pinCode = '1234';
    const address = 'address123';
    const response = { success: true };

    promptHandler
      .mockResolvedValueOnce(pinCode)
      .mockResolvedValueOnce(address);
    (wallet.createAndSendNanoContractTransaction as jest.Mock).mockResolvedValue(response);

    const result = await sendNanoContractTx(rpcRequest, wallet, promptHandler);

    expect(promptHandler).toHaveBeenCalledTimes(2);
    expect(promptHandler).toHaveBeenCalledWith({
      type: ConfirmationPromptTypes.PinConfirmationPrompt,
      method: rpcRequest.method,
    });
    expect(wallet.createAndSendNanoContractTransaction).toHaveBeenCalledWith(
      rpcRequest.params.method,
      address,
      {
        blueprint_id: rpcRequest.params.blueprint_id,
        actions: rpcRequest.params.actions,
        args: rpcRequest.params.args,
      },
      { pinCode }
    );
    expect(result).toEqual(response);
  });

  it('should throw SendNanoContractTxFailure if the transaction fails', async () => {
    const pinCode = '1234';
    const address = 'address123';

    promptHandler
      .mockResolvedValueOnce(pinCode)
      .mockResolvedValueOnce(address);
    (wallet.createAndSendNanoContractTransaction as jest.Mock).mockRejectedValue(new Error('Transaction failed'));

    await expect(sendNanoContractTx(rpcRequest, wallet, promptHandler)).rejects.toThrow(SendNanoContractTxFailure);

    expect(promptHandler).toHaveBeenCalledTimes(2);
    expect(promptHandler).toHaveBeenCalledWith({
      type: ConfirmationPromptTypes.AddressRequestPrompt,
      method: rpcRequest.method
    });
    expect(wallet.createAndSendNanoContractTransaction).toHaveBeenCalledWith(
      rpcRequest.params.method,
      address,
      {
        blueprint_id: rpcRequest.params.blueprint_id,
        actions: rpcRequest.params.actions,
        args: rpcRequest.params.args,
      },
      { pinCode }
    );
  });
});
