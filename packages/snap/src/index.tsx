import { config, addressUtils, walletUtils, cryptoUtils, HathorWalletServiceWallet, Network } from '@hathor/wallet-lib';
import { getAddress, getBalance, PromptRejectedError } from '@hathor/hathor-rpc-handler';
import type { OnHomePageHandler, OnInstallHandler, OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { Box, Text, Bold, Heading, Link } from '@metamask/snaps-sdk/jsx';

export const onHomePage: OnHomePageHandler = async () => {
  return {
    content: (
      <Box>
        <Heading>THIS IS HATHOR HOME PAGE!</Heading>
        <Text>Welcome to my Snap home page!</Text>
      </Box>
    ),
  };
};

export const onInstall: OnInstallHandler = async () => {
  await snap.request({
    method: "snap_dialog",
    params: {
      type: "alert",
      content: (
        <Box>
          <Heading>Installation successful</Heading>
          <Text>
            To learn all possibilities read the <Link href="https://docs.hathor.network/">docs</Link>.
          </Text>
        </Box>
      ),
    },
  });
};

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */

const network = 'mainnet';

const getHathorWallet = async () => {
  const walletServiceURL = 'https://wallet-service.hathor.network/';
  const networkObject = new Network(network);
  const persistedData = await snap.request({
    method: "snap_manageState",
    params: { operation: "get" },
  }) ?? {};

  let accountPathXpriv = persistedData.accountPathXpriv;
  let authPathXpriv = persistedData.authPathXpriv;

  if (!accountPathXpriv || !authPathXpriv) {
    // Get the Hathor node, corresponding to the path m/44'/280'/0'.
    const hathorNode = await snap.request({
      method: "snap_getBip32Entropy",
      params: {
        curve: 'secp256k1',
        path: ['m', '44\'', '280\'', '0\''],
      },
    })

    const authHathorNode = await snap.request({
      method: "snap_getBip32Entropy",
      params: {
        curve: 'secp256k1',
        path: ['m', '280\'', '280\''],
      },
    })

    accountPathXpriv = walletUtils.xprivFromData(Buffer.from(hathorNode.privateKey.substring(2), 'hex'), Buffer.from(hathorNode.chainCode.substring(2), 'hex'), hathorNode.parentFingerprint, hathorNode.depth, hathorNode.index, 'mainnet');
    authPathXpriv = walletUtils.xprivFromData(Buffer.from(authHathorNode.privateKey.substring(2), 'hex'), Buffer.from(authHathorNode.chainCode.substring(2), 'hex'), authHathorNode.parentFingerprint, authHathorNode.depth, authHathorNode.index, 'mainnet');

    await snap.request({
      method: "snap_manageState",
      params: {
        operation: "update",
        newState: { accountPathXpriv, authPathXpriv },
      },
    })
  }

  const wallet = new HathorWalletServiceWallet({
    requestPassword: () => Promise.resolve('123'),
    xpriv: accountPathXpriv,
    authxpriv: authPathXpriv,
    network: networkObject,
    enableWs: false,
  });

  config.setWalletServiceBaseUrl(walletServiceURL);

  await wallet.start({ pinCode: '123', password: '123' });

  return wallet;
}

export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  // eslint-disable-next-line
  const wallet = await getHathorWallet();
  let promptHandler;
  switch (request.method) {
    case 'balance':
      const tokens = request.params.tokens;
      promptHandler = async (promptData, requestMetadata) => (
        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'confirmation',
            content: (
              <Box>
                <Text>
                  The dApp {origin} wants to get the balance of the following tokens:
                </Text>
                <Text>
                  {tokens.join(", ")}
                </Text>
                <Text>
                  Confirm the action below to continue.
                </Text>
              </Box>
            ),
          },
        })
      );

      try {
        const balance = await getBalance(
          {
            method: 'htr_getBalance',
            params:
              {
                ...request.params,
                network,
              }
          },
          wallet,
          {},
          promptHandler
        );
        return balance;
      } catch (e) {
        if (e instanceof PromptRejectedError) {
        } else {
          throw e;
        }
      }
      return null;
    case 'address':
      promptHandler = async (promptData, requestMetadata) => (
        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'confirmation',
            content: (
              <Box>
                <Text>
                  The dApp {origin} wants to get your first empty address.
                </Text>
                <Text>
                  Confirm the action below to continue.
                </Text>
              </Box>
            ),
          },
        })
      );

      try {
        const address = await getAddress(
          {
            method: 'htr_getAddress',
            params:
              {
                type: 'first_empty',
                network,
              }
          },
          wallet,
          {},
          promptHandler
        );
        return address;
      } catch (e) {
        if (e instanceof PromptRejectedError) {
        } else {
          throw e;
        }
      }

      return null;
    default:
      throw new Error('Invalid request');
  }
};