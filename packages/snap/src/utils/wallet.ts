import { constants as libConstants, config, walletUtils, HathorWalletServiceWallet, Network } from '@hathor/wallet-lib';
import { REQUEST_METHODS, nodeURL, txMiningURL, walletServiceURL } from '../constants';

export const getHathorWallet = async (network: string): HathorWalletServiceWallet => {
  const networkObject = new Network(network);
  // First we try to get the xpriv data from the persisted data
  // By default, the data is automatically encrypted using a Snap-specific
  // key and automatically decrypted when retrieved
  // https://docs.metamask.io/snaps/reference/snaps-api/#snap_managestate
  const persistedData = await snap.request({
    method: REQUEST_METHODS.MANAGE_STATE,
    params: { operation: 'get' },
  }) ?? {};

  let accountPathXpriv = persistedData.accountPathXpriv;
  let authPathXpriv = persistedData.authPathXpriv;

  // If the xpriv is not in the persisted data, we create and save it
  if (!accountPathXpriv || !authPathXpriv) {
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

    accountPathXpriv = walletUtils.xprivFromData(
      Buffer.from(hathorNode.privateKey.substring(2), 'hex'),
      Buffer.from(hathorNode.chainCode.substring(2), 'hex'),
      hathorNode.parentFingerprint,
      hathorNode.depth,
      hathorNode.index,
      network
    );
    authPathXpriv = walletUtils.xprivFromData(
      Buffer.from(authHathorNode.privateKey.substring(2), 'hex'),
      Buffer.from(authHathorNode.chainCode.substring(2), 'hex'),
      authHathorNode.parentFingerprint,
      authHathorNode.depth,
      authHathorNode.index,
      network
    );

    await snap.request({
      method: REQUEST_METHODS.MANAGE_STATE,
      params: {
        operation: 'update',
        newState: { accountPathXpriv, authPathXpriv },
      },
    })
  }

  const pin = '123';
  const wallet = new HathorWalletServiceWallet({
    requestPassword: () => Promise.resolve(pin),
    xpriv: accountPathXpriv,
    authxpriv: authPathXpriv,
    network: networkObject,
    enableWs: false,
  });

  config.setServerUrl(nodeURL);
  config.setNetwork(network);
  config.setWalletServiceBaseUrl(walletServiceURL);
  config.setTxMiningUrl(txMiningURL);

  await wallet.start({ pinCode: pin, password: pin });

  return wallet;
}