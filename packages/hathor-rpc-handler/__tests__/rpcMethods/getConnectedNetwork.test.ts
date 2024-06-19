/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from "@hathor/wallet-lib";
import { getConnectedNetwork } from "../../src/rpcMethods/getConnectedNetwork";
import { mockGetConnectedNetworkRequest } from "../mocks";

export const mockWallet = {
  getNetworkObject: jest.fn().mockResolvedValue({ name: 'mainnet' }),
} as unknown as HathorWallet;

describe('getConnectedNetwork', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return network information', async () => {
    const result = await getConnectedNetwork(mockGetConnectedNetworkRequest, mockWallet);

    expect(mockWallet.getNetworkObject).toHaveBeenCalled();
    expect(result).toStrictEqual({
      network: 'mainnet',
      genesisHash: '', // TODO: Update when logic to retrieve genesisHash is implemented
    });
  });
});