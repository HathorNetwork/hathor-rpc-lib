/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { constants as libConstants, walletUtils, HathorWalletServiceWallet, Network } from '@hathor/wallet-lib';
import { DEFAULT_PIN_CODE, REQUEST_METHODS } from '../constants';
import { getNetworkData, configNetwork } from './network';

export const getHathorWallet = async (): HathorWalletServiceWallet => {
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

  // Set lib config data and start the wallet
  await configNetwork();

  await wallet.start({ pinCode: DEFAULT_PIN_CODE, password: DEFAULT_PIN_CODE });

  return wallet;
}