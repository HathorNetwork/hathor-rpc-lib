/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Network, bufferUtils, errors, nanoUtils, walletUtils, type IHathorWallet } from '@hathor/wallet-lib';
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
    } as Partial<IHathorWallet> as IHathorWallet;
  });

  it('should throw PromptRejectedError if user rejects the sign oracle data trigger request', async () => {
    mockPromptHandler.mockResolvedValueOnce(false);

    await expect(signOracleData(mockSignOracleDataRequest, wallet, {}, mockPromptHandler)).rejects.toThrow(PromptRejectedError);

    expect(mockPromptHandler).toHaveBeenNthCalledWith(1, {
      ...mockSignOracleDataRequest,
      type: TriggerTypes.SignOracleDataConfirmationPrompt,
      data: {
        ncId: mockSignOracleDataRequest.params.nc_id,
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
        ncId: mockSignOracleDataRequest.params.nc_id,
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
        ncId: mockSignOracleDataRequest.params.nc_id,
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
  } as Partial<IHathorWallet> as IHathorWallet;

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

  // A 30-byte nc_id plus a one-character data serialize to exactly 32 bytes: the shape that would
  // let the oracle signature be the input signature of a transaction the dApp built.
  it.each([
    ['30 bytes', 'ab'.repeat(30)],
    ['63 hex characters', '0'.repeat(63)],
    ['65 hex characters', '0'.repeat(65)],
    ['a 0x prefix', `0x${'0'.repeat(62)}`],
    ['a non-hex character', `${'0'.repeat(63)}g`],
    ['an empty string', ''],
  ])('should reject an nc_id of %s before any prompt', async (_label, ncId) => {
    const request = {
      method: RpcMethods.SignOracleData,
      params: {
        nc_id: ncId,
        network: 'testnet',
        oracle: '76a9140b4671452484138af42caf9c9676d951a075232c88ac',
        data: '/',
      },
    } as SignOracleDataRpcRequest;

    await expect(
      signOracleData(request, mockWallet, {}, mockTriggerHandler)
    ).rejects.toThrow(new InvalidParamsError('nc_id: nc_id must be a nano contract id: 64 hex characters'));
    expect(mockTriggerHandler).not.toHaveBeenCalled();
  });

  it('should accept valid parameters', async () => {
    const validRequest = {
      method: RpcMethods.SignOracleData,
      params: {
        nc_id: '000063f99b133c7630bc9d0117919f5b8726155412ad063dbbd618bdc7f85d7a',
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

// Runs the wallet-lib oracle signing for real (no nanoUtils mocks) against an xpub-only wallet.
describe('signOracleData with a readonly wallet', () => {
  const network = new Network('mainnet');
  const ncId = '00'.repeat(32);
  // Any fixed key works: only the signing path matters here.
  const oracleKey = walletUtils
    .getXPrivKeyFromSeed(walletUtils.generateWalletWords(), { networkName: 'mainnet' })
    .deriveChild(0);
  const oracleAddress = oracleKey.publicKey.toAddress(network.bitcoreNetwork).toString();

  const request = {
    method: RpcMethods.SignOracleData,
    params: { nc_id: ncId, network: 'mainnet', oracle: oracleAddress, data: 'yes' },
  } as SignOracleDataRpcRequest;

  const buildWallet = (hasPrivateKeyMethod: boolean) => ({
    getNetwork: jest.fn().mockReturnValue('mainnet'),
    getNetworkObject: jest.fn().mockReturnValue(network),
    storage: {
      isReadonly: jest.fn().mockResolvedValue(true),
      hasPrivateKeyMethod: jest.fn().mockReturnValue(hasPrivateKeyMethod),
    },
    isAddressMine: jest.fn().mockImplementation(async (address: string) => address === oracleAddress),
    getPrivateKeyFromAddress: jest.fn().mockResolvedValue(oracleKey.privateKey),
  } as unknown as IHathorWallet);

  const acceptAll = () => jest.fn()
    .mockResolvedValueOnce({ type: TriggerResponseTypes.SignOracleDataConfirmationResponse, data: true })
    .mockResolvedValueOnce({ type: TriggerResponseTypes.PinRequestResponse, data: { accepted: true, pinCode: '' } });

  beforeEach(() => {
    // The suite above replaces nanoUtils with spies; this one needs the real functions.
    jest.restoreAllMocks();
  });

  it('should sign with the key from an external private-key provider', async () => {
    const wallet = buildWallet(true);

    const result = await signOracleData(request, wallet, {}, acceptAll());

    expect(wallet.getPrivateKeyFromAddress).toHaveBeenCalledWith(oracleAddress, { pinCode: '' });
    expect(result.type).toBe(RpcResponseTypes.SignOracleDataResponse);
    // The signature is the oracle input data: the signature followed by the oracle's public key
    const { signature } = (result.response as { signedData: { signature: string } }).signedData;
    expect(signature.endsWith(oracleKey.publicKey.toString())).toBe(true);
  });

  it('should still refuse to sign without an external private-key provider', async () => {
    const wallet = buildWallet(false);

    await expect(signOracleData(request, wallet, {}, acceptAll())).rejects.toThrow(errors.WalletFromXPubGuard);
    expect(wallet.getPrivateKeyFromAddress).not.toHaveBeenCalled();
  });
});
