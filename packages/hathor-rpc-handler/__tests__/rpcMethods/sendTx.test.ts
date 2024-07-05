/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { prepareTxFunds } from '../../src/helpers/transactions';
import { TriggerResponseTypes, PinRequestResponse, SendTxConfirmationResponse } from '../../src/types';
import { sendTx } from '../../src/rpcMethods/sendTx';
import { mockPromptHandler, mockSendTxRequest } from '../mocks';
import { HathorWallet, Network } from '@hathor/wallet-lib';
import { PromptRejectedError } from '../../src/errors';

jest.mock('../../src/helpers/transactions', () => ({
  prepareTxFunds: jest.fn(),
  getUtxosToFillTx: jest.fn(),
}));

describe('sendTx', () => {
  let wallet: jest.Mocked<HathorWallet>;

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    wallet = {
      getNetworkObject: jest.fn().mockReturnValue(new Network('mainnet')),
      sendManyOutputsTransaction: jest.fn(),
    } as unknown as HathorWallet;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send transaction successfully', async () => {
    const mockPreparedFundsResponse = {
      inputs: [],
      outputs: [],
    };

    const mockPinResponse: PinRequestResponse = {
      type: TriggerResponseTypes.PinRequestResponse,
      data: {
        accepted: true,
        pinCode: '1234',
      }
    };

    const mockSendTxResponse: SendTxConfirmationResponse = {
      type: TriggerResponseTypes.SendTxConfirmationResponse,
      data: true,
    };

    (prepareTxFunds as jest.Mock).mockResolvedValue(mockPreparedFundsResponse);

    mockPromptHandler
      .mockResolvedValueOnce(mockPinResponse)
      .mockResolvedValueOnce(mockSendTxResponse);

    (wallet.sendManyOutputsTransaction as jest.Mock).mockResolvedValue({});

    const response = await sendTx(mockSendTxRequest, wallet as HathorWallet, {}, mockPromptHandler);

    expect(response).toBeDefined();
    expect(prepareTxFunds).toHaveBeenCalledWith(
      wallet,
      mockSendTxRequest.params.outputs,
      mockSendTxRequest.params.inputs,
      mockSendTxRequest.params.token
    );
    expect(mockPromptHandler).toHaveBeenCalledTimes(2);
    expect(wallet.sendManyOutputsTransaction).toHaveBeenCalledWith(
      mockPreparedFundsResponse.outputs,
      {
        inputs: mockPreparedFundsResponse.inputs,
        changeAddress: mockSendTxRequest.params.changeAddress,
        // Typescript is not smart enough to understand that accepted is true here,
        // so we force cast it
        pinCode: (mockPinResponse.data as {accepted: boolean; pinCode: string }).pinCode,
      }
    );
  });

  it('should throw PromptRejectedError if transaction is rejected', async () => {
    const mockPreparedFundsResponse = {
      inputs: [],
      outputs: [],
    };

    const mockPinResponse: PinRequestResponse = {
      type: TriggerResponseTypes.PinRequestResponse,
      data: {
        accepted: true,
        pinCode: '1234',
      }
    };

    const mockSendTxResponse: SendTxConfirmationResponse = {
      type: TriggerResponseTypes.SendTxConfirmationResponse,
      data: false,
    };

    (prepareTxFunds as jest.Mock).mockResolvedValue(mockPreparedFundsResponse);
    mockPromptHandler
      .mockResolvedValueOnce(mockPinResponse)
      .mockResolvedValueOnce(mockSendTxResponse);

    await expect(sendTx(mockSendTxRequest, wallet as HathorWallet, {}, mockPromptHandler)).rejects.toThrow(
      PromptRejectedError
    );

    expect(prepareTxFunds).toHaveBeenCalledWith(
      wallet,
      mockSendTxRequest.params.outputs,
      mockSendTxRequest.params.inputs,
      mockSendTxRequest.params.token
    );
    expect(mockPromptHandler).toHaveBeenCalledTimes(2);
    expect(wallet.sendManyOutputsTransaction).not.toHaveBeenCalled();
  });
});
