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
 * Helper function to derive xpriv from a BIP32 path
 * @param path - BIP32 derivation path (e.g., libConstants.P2PKH_ACCT_PATH)
 * @param network - Network name (e.g., 'mainnet', 'testnet')
 * @returns The derived xpriv key
 */
async function getXpriv(path: string, network: string): Promise<string> {
  const node = await snap.request({
    method: REQUEST_METHODS.GET_BIP32_ENTROPY,
    params: {
      curve: 'secp256k1',
      path: path.split('/'),
    },
  });

  return walletUtils.xprivFromData(
    Buffer.from(node.privateKey.substring(2), 'hex'),
    Buffer.from(node.chainCode.substring(2), 'hex'),
    node.parentFingerprint,
    node.depth,
    node.index,
    network
  );
}

/**
 * Initializes the wallet on the wallet-service without waiting for it to be ready.
 * This is useful for background initialization (e.g., during snap installation).
 * The wallet will be available for read-only access once it's ready on the service.
 */
export const initializeWalletOnService = async (): Promise<string> => {
  const wallet = await getHathorWallet();

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
      return error.response.data.status.walletId;
    }

    // For other errors, re-throw
    throw error;
  }
};

/**
 * Get a read-only Hathor wallet instance that can be used for RPC requests
 * that don't require signing (e.g., getBalance, getAddress, getUtxos, etc.)
 *
 * Read-only wallets use only the xpub and don't require access to private keys,
 * making them faster to initialize and more secure for read operations.
 */
export const getAndStartReadOnlyHathorWallet = async (): Promise<HathorWalletServiceWallet> => {
  // Get network data from persistent storage
  const networkData = await getNetworkData();
  const network = networkData.network;
  const networkObject = new Network(network);

  // Derive xpriv using helper function
  const accountPathXpriv = await getXpriv(libConstants.P2PKH_ACCT_PATH, network);

  // Convert xpriv to xpub using bitcore (ensures same derivation as full wallet)
  const HDPrivateKey = require('bitcore-lib').HDPrivateKey;
  const hdPrivateKey = new HDPrivateKey(accountPathXpriv);
  const xpub = hdPrivateKey.hdPublicKey.toString();

  const wallet = new HathorWalletServiceWallet({
    requestPassword: () => Promise.resolve(''),
    xpub,
    network: networkObject,
    enableWs: false, // WebSockets are not available in snap environment
  });

  // Set lib config data and start the wallet in read-only mode
  await configNetwork();
  await wallet.startReadOnly({ skipAddressFetch: true });

  return wallet;
};

export const getHathorWallet = async (): Promise<HathorWalletServiceWallet> => {
  // Get network data from persistent storage
  const networkData = await getNetworkData();
  const network = networkData.network;
  const networkObject = new Network(network);

  // Derive xprivs using helper function
  const accountPathXpriv = await getXpriv(libConstants.P2PKH_ACCT_PATH, network);
  const authPathXpriv = await getXpriv(libConstants.WALLET_SERVICE_AUTH_DERIVATION_PATH, network);

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
}

export const getAndStartHathorWallet = async (): Promise<HathorWalletServiceWallet> => {
  const wallet = await getHathorWallet();

  await wallet.start({ pinCode: DEFAULT_PIN_CODE, password: DEFAULT_PIN_CODE });

  return wallet;
}
