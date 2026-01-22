/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Network, bufferUtils, nanoUtils, type IHathorWallet } from '@hathor/wallet-lib';
import {
  TriggerTypes,
  TriggerResponseTypes,
  RpcResponseTypes,
  RpcMethods,
  SignOracleDataRpcRequest,
} from '../../src/types';
import { mockPromptHandler, mockSignOracleDataRequest } from '../mocks';
import { signOracleData } from '../../src/rpcMethods/signOracleData';
import { PromptRejectedError } from '../../src/errors';
import { InvalidParamsError } from '../../src/errors';

describe('signOracleData', () => {
  let wallet: IHathorWallet;

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    const returnValue = bufferUtils.hexToBuffer(mockSignOracleDataRequest.params.oracle);
    jest.spyOn(nanoUtils, 'getOracleBuffer').mockReturnValue(returnValue);
    jest.spyOn(nanoUtils, 'getOracleSignedDataFromUser').mockResolvedValue({
      type: 'str',
      signature: 'mock-signed-result',
      value: 'yes',
    });

    wallet = {
      getNetwork: jest.fn().mockReturnValue('mainnet'),
      getNetworkObject: jest.fn().mockReturnValue(new Network('mainnet')),
    } as unknown as IHathorWallet;
  });

  it('should throw PromptRejectedError if user rejects the sign oracle data trigger request', async () => {
    mockPromptHandler.mockResolvedValueOnce(false);

    await expect(signOracleData(mockSignOracleDataRequest, wallet, {}, mockPromptHandler)).rejects.toThrow(PromptRejectedError);

    expect(mockPromptHandler).toHaveBeenNthCalledWith(1, {
      ...mockSignOracleDataRequest,
      type: TriggerTypes.SignOracleDataConfirmationPrompt,
      data: {
        oracle: mockSignOracleDataRequest.params.oracle,
        data: mockSignOracleDataRequest.params.data,
      },
    }, {});

    expect(nanoUtils.getOracleSignedDataFromUser).not.toHaveBeenCalled();
  });

  it('should throw PromptRejectedError if user rejects the PIN prompt', async () => {
    mockPromptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SignOracleDataConfirmationResponse,
        data: true,
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: false
        },
      });

    await expect(signOracleData(mockSignOracleDataRequest, wallet, {}, mockPromptHandler)).rejects.toThrow(PromptRejectedError);

    expect(mockPromptHandler).toHaveBeenNthCalledWith(1, {
      ...mockSignOracleDataRequest,
      type: TriggerTypes.SignOracleDataConfirmationPrompt,
      data: {
        oracle: mockSignOracleDataRequest.params.oracle,
        data: mockSignOracleDataRequest.params.data,
      },
    }, {});

    expect(mockPromptHandler).toHaveBeenNthCalledWith(2, {
      ...mockSignOracleDataRequest,
      type: TriggerTypes.PinConfirmationPrompt,
    }, {});

    expect(nanoUtils.getOracleSignedDataFromUser).not.toHaveBeenCalled();
  });

  it('should return signed oracle data if user confirms and provides PIN', async () => {
    mockPromptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SignOracleDataConfirmationResponse,
        data: true,
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: true,
          pinCode: 'mock_pin',
        },
      });

    const result = await signOracleData(mockSignOracleDataRequest, wallet, {}, mockPromptHandler);

    expect(mockPromptHandler).toHaveBeenNthCalledWith(1, {
      ...mockSignOracleDataRequest,
      type: TriggerTypes.SignOracleDataConfirmationPrompt,
      data: {
        oracle: mockSignOracleDataRequest.params.oracle,
        data: mockSignOracleDataRequest.params.data,
      },
    }, {});

    expect(mockPromptHandler).toHaveBeenNthCalledWith(2, {
      ...mockSignOracleDataRequest,
      type: TriggerTypes.PinConfirmationPrompt,
    }, {});

    // Verify the new API is called with correct parameters
    expect(nanoUtils.getOracleSignedDataFromUser).toHaveBeenCalledWith(
      bufferUtils.hexToBuffer(mockSignOracleDataRequest.params.oracle),
      mockSignOracleDataRequest.params.nc_id,
      'SignedData[str]',
      mockSignOracleDataRequest.params.data,
      wallet,
      { pinCode: 'mock_pin' }
    );

    expect(result).toStrictEqual({
      type: RpcResponseTypes.SignOracleDataResponse,
      response: {
        data: mockSignOracleDataRequest.params.data,
        signedData: {
          value: 'yes',
          signature: 'mock-signed-result',
          type: 'str',
        },
        oracle: mockSignOracleDataRequest.params.oracle,
      }
    });
  });
});

describe('signOracleData parameter validation', () => {
  const mockWallet = {
    getNetworkObject: jest.fn(),
    getNetwork: jest.fn().mockReturnValue('testnet'),
    pinCode: null,
  } as unknown as IHathorWallet;

  const mockTriggerHandler = jest.fn().mockResolvedValue({
    type: TriggerResponseTypes.SignOracleDataConfirmationResponse,
    data: {
      accepted: true,
      pinCode: '1234'
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject when network is missing', async () => {
    const invalidRequest = {
      method: RpcMethods.SignOracleData,
      params: {
        oracle: 'test-oracle',
        data: 'test-data',
        // network is missing
      },
    } as SignOracleDataRpcRequest;

    await expect(
      signOracleData(invalidRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when oracle is empty', async () => {
    const invalidRequest = {
      method: RpcMethods.SignOracleData,
      params: {
        network: 'testnet',
        oracle: '',
        data: 'test-data',
      },
    } as SignOracleDataRpcRequest;

    await expect(
      signOracleData(invalidRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should reject when data is empty', async () => {
    const invalidRequest = {
      method: RpcMethods.SignOracleData,
      params: {
        network: 'testnet',
        oracle: 'test-oracle',
        data: '',
      },
    } as SignOracleDataRpcRequest;

    await expect(
      signOracleData(invalidRequest, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(InvalidParamsError);
  });

  it('should accept valid parameters', async () => {
    const validRequest = {
      method: RpcMethods.SignOracleData,
      params: {
        nc_id: 'test-nc-id',
        network: 'testnet',
        oracle: '76a9140b4671452484138af42caf9c9676d951a075232c88ac',
        data: 'test-data',
      },
    } as SignOracleDataRpcRequest;

    mockTriggerHandler.mockResolvedValue({
      data: { accepted: true, pinCode: '1234' }
    });

    await expect(
      signOracleData(validRequest, mockWallet, {}, mockTriggerHandler)
    ).resolves.toBeDefined();
  });
});
