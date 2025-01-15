/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet, Network, bufferUtils, nanoUtils } from '@hathor/wallet-lib';
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

jest.mock('@hathor/wallet-lib', () => ({
  ...jest.requireActual('@hathor/wallet-lib'),
  nanoUtils: {
    getOracleBuffer: jest.fn().mockReturnValue(Buffer.from('oracle-data')),
    getOracleInputData: jest.fn().mockResolvedValue(Buffer.from('oracle-data')),
  },
  NanoContractSerializer: jest.fn().mockImplementation(() => ({
    serializeFromType: jest.fn(),
  })),
}));

describe('signOracleData', () => {
  let wallet: jest.Mocked<HathorWallet>;

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    wallet = {
      getNetwork: jest.fn().mockReturnValue('mainnet'),
      getNetworkObject: jest.fn().mockReturnValue(new Network('mainnet')),
    } as unknown as HathorWallet;
  });

  it('should throw PromptRejectedError if user rejects the sign oracle data trigger request', async () => {
    mockPromptHandler.mockResolvedValueOnce(false);

    await expect(signOracleData(mockSignOracleDataRequest, wallet, {}, mockPromptHandler)).rejects.toThrow(PromptRejectedError);

    expect(mockPromptHandler).toHaveBeenNthCalledWith(1, {
      type: TriggerTypes.SignOracleDataConfirmationPrompt,
      method: mockSignOracleDataRequest.method,
      data: {
        oracle: mockSignOracleDataRequest.params.oracle,
        data: mockSignOracleDataRequest.params.data,
      },
    }, {});

    expect(nanoUtils.getOracleBuffer).not.toHaveBeenCalled();
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
      type: TriggerTypes.SignOracleDataConfirmationPrompt,
      method: mockSignOracleDataRequest.method,
      data: {
        oracle: mockSignOracleDataRequest.params.oracle,
        data: mockSignOracleDataRequest.params.data,
      },
    }, {});

    expect(mockPromptHandler).toHaveBeenNthCalledWith(2, {
      type: TriggerTypes.PinConfirmationPrompt,
      method: mockSignOracleDataRequest.method,
    }, {});

    expect(nanoUtils.getOracleBuffer).not.toHaveBeenCalled();
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
      type: TriggerTypes.SignOracleDataConfirmationPrompt,
      method: mockSignOracleDataRequest.method,
      data: {
        oracle: mockSignOracleDataRequest.params.oracle,
        data: mockSignOracleDataRequest.params.data,
      },
    }, {});

    expect(mockPromptHandler).toHaveBeenNthCalledWith(2, {
      type: TriggerTypes.PinConfirmationPrompt,
      method: mockSignOracleDataRequest.method,
    }, {});

    const oracleDataBuf = Buffer.from('oracle-data');
    const signature = `${bufferUtils.bufferToHex(oracleDataBuf)},${mockSignOracleDataRequest.params.data},str`;

    expect(result).toStrictEqual({
      type: RpcResponseTypes.SignOracleDataResponse,
      response: {
        data: mockSignOracleDataRequest.params.data,
        signature,
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
  } as unknown as HathorWallet;

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
        network: 'testnet',
        oracle: 'test-oracle',
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
