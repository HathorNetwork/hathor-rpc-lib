/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { config } from '@hathor/wallet-lib';
import { REQUEST_METHODS, DEFAULT_NETWORK, NETWORK_MAP } from '../constants';

/*
 * Get persisted network data or the default from constants
 */
export const getNetworkData = async () => {
  const persistedData = await snap.request({
    method: REQUEST_METHODS.MANAGE_STATE,
    params: { operation: 'get' },
  }) ?? {};

  const network = persistedData.network ?? DEFAULT_NETWORK;
  // Ensure the network exists in NETWORK_MAP, fallback to DEFAULT_NETWORK if not
  return NETWORK_MAP[network] ?? NETWORK_MAP[DEFAULT_NETWORK];
}

/*
 * Set network, persist data in storage and update wallet lib config
 */
export const setNetwork = async (network: string) => {
  const persistedData = await snap.request({
    method: REQUEST_METHODS.MANAGE_STATE,
    params: { operation: 'get' },
  }) ?? {};

  await snap.request({
    method: REQUEST_METHODS.MANAGE_STATE,
    params: {
      operation: 'update',
      newState: { ...persistedData, network },
    },
  });

  await configNetwork();
}

/*
 * Update wallet lib config with persisted network data
 */
export const configNetwork = async () => {
  const networkData = await getNetworkData();

  config.setServerUrl(networkData.nodeURL);
  config.setNetwork(networkData.network);
  config.setWalletServiceBaseUrl(networkData.walletServiceURL);
  config.setTxMiningUrl(networkData.txMiningURL);
}
