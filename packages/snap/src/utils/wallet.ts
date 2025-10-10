/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { constants as libConstants, walletUtils, HathorWalletServiceWallet, Network } from '@hathor/wallet-lib';
import { DEFAULT_PIN_CODE, REQUEST_METHODS } from '../constants';
import { getNetworkData, configNetwork } from './network';

/**
 * Creates a Hathor wallet instance without starting it.
 * Useful when you need to initialize the wallet with custom options.
 */
export const createHathorWallet = async (): Promise<HathorWalletServiceWallet> => {
  // Get network data from persistent storage
  const networkData = await getNetworkData();
  const network = networkData.network;
  const networkObject = new Network(network);

  // Get the Hathor node, corresponding to the path m/44'/280'/0'.
  const hathorNode = await snap.request({
    method: REQUEST_METHODS.GET_BIP32_ENTROPY,
    params: {
      curve: 'secp256k1',
      path: libConstants.P2PKH_ACCT_PATH.split('/'),
    },
  })

  const authHathorNode = await snap.request({
    method: REQUEST_METHODS.GET_BIP32_ENTROPY,
    params: {
      curve: 'secp256k1',
      path: libConstants.WALLET_SERVICE_AUTH_DERIVATION_PATH.split('/'),
    },
  })

  const accountPathXpriv = walletUtils.xprivFromData(
    Buffer.from(hathorNode.privateKey.substring(2), 'hex'),
    Buffer.from(hathorNode.chainCode.substring(2), 'hex'),
    hathorNode.parentFingerprint,
    hathorNode.depth,
    hathorNode.index,
    network
  );
  const authPathXpriv = walletUtils.xprivFromData(
    Buffer.from(authHathorNode.privateKey.substring(2), 'hex'),
    Buffer.from(authHathorNode.chainCode.substring(2), 'hex'),
    authHathorNode.parentFingerprint,
    authHathorNode.depth,
    authHathorNode.index,
    network
  );

  const wallet = new HathorWalletServiceWallet({
    requestPassword: () => Promise.resolve(DEFAULT_PIN_CODE),
    xpriv: accountPathXpriv,
    authxpriv: authPathXpriv,
    network: networkObject,
    enableWs: false,
  });

  // Set lib config data
  await configNetwork();

  return wallet;
};

/**
 * Gets a fully initialized and ready Hathor wallet.
 * This is the main function used for RPC requests.
 */
export const getHathorWallet = async (): Promise<HathorWalletServiceWallet> => {
  const wallet = await createHathorWallet();

  // Start the wallet and wait for it to be ready
  await wallet.start({ pinCode: DEFAULT_PIN_CODE, password: DEFAULT_PIN_CODE });

  return wallet;
};

/**
 * Initializes the wallet on the wallet-service without waiting for it to be ready.
 * This is useful for background initialization (e.g., during snap installation).
 * The wallet will be available for read-only access once it's ready on the service.
 */
export const initializeWalletOnService = async (): Promise<string> => {
  const wallet = await createHathorWallet();

  try {
    // Start the wallet without waiting for it to be ready
    // This creates the wallet on wallet-service but returns immediately
    await wallet.start({
      pinCode: DEFAULT_PIN_CODE,
      password: DEFAULT_PIN_CODE,
      waitReady: false
    });

    return wallet.walletId;
  } catch (error: any) {
    // Check if this is a "wallet already loaded" error (400 status)
    // The wallet-service returns 400 when wallet already exists
    if (error?.response?.data?.error === 'wallet-already-loaded') {
      console.log('✅ Wallet already exists on wallet-service');
      return error.response.data.status.walletId;
    }

    // For other errors, re-throw
    throw error;
  }
};