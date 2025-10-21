/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export enum REQUEST_METHODS {
  MANAGE_STATE = 'snap_manageState',
  GET_BIP32_ENTROPY = 'snap_getBip32Entropy',
  DIALOG = 'snap_dialog',
}

export enum DIALOG_TYPES {
  CONFIRMATION = 'confirmation',
  ALERT = 'alert',
}

const MAINNET_URLS = {
  nodeURL: 'https://node1.mainnet.hathor.network/v1a/',
  walletServiceURL: 'https://wallet-service.hathor.network',
  txMiningURL: 'https://txmining.mainnet.hathor.network/',
  network: 'mainnet',
}

const NANO_BRAVO_URLS = {
  nodeURL: 'https://node1.bravo.nano-testnet.hathor.network/v1a/',
  walletServiceURL: 'https://wallet-service.bravo.nano-testnet.hathor.network',
  txMiningURL: 'https://txmining.bravo.nano-testnet.hathor.network/',
  network: 'testnet',
}

const TESTNET_URLS = {
  nodeURL: 'https://node1.testnet.hathor.network/v1a/',
  walletServiceURL: 'https://wallet-service.testnet.hathor.network',
  txMiningURL: 'https://txmining.testnet.hathor.network/',
  network: 'testnet',
}

const DEV_TESTNET_URLS = {
  nodeURL: 'https://node1.testnet.hathor.network/v1a/',
  walletServiceURL: 'https://dev.wallet-service.testnet.hathor.network',
  txMiningURL: 'https://txmining.testnet.hathor.network/',
  network: 'testnet',
}

export const NETWORK_MAP = {
  'mainnet': MAINNET_URLS,
  'nano-bravo-testnet': NANO_BRAVO_URLS,
  'testnet': TESTNET_URLS,
  'testnet-hotel': TESTNET_URLS,
  'dev-testnet': DEV_TESTNET_URLS,
}

export const DEFAULT_NETWORK = 'dev-testnet';

export const DEFAULT_PIN_CODE = '123';
