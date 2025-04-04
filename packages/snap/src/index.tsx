import { config, addressUtils, walletUtils, cryptoUtils, HathorWalletServiceWallet, Network } from '@hathor/wallet-lib';
import { getAddress, PromptRejectedError } from '@hathor/hathor-rpc-handler';
import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { Box, Text, Bold, Heading, Spinner } from '@metamask/snaps-sdk/jsx';

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

const walletServiceURL = 'https://wallet-service.hathor.network/';
//const network = new Network('mainnet');
let wallet;

export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  console.log('AQUIIIIIII', request.method);
  // eslint-disable-next-line
  switch (request.method) {
    case 'address':
      const promptHandler = async (promptData, requestMetadata) => (
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

      const accountPathXpriv = walletUtils.xprivFromData(Buffer.from(hathorNode.privateKey.substring(2), 'hex'), Buffer.from(hathorNode.chainCode.substring(2), 'hex'), hathorNode.parentFingerprint, hathorNode.depth, hathorNode.index, 'mainnet')
      const authPathXpriv = walletUtils.xprivFromData(Buffer.from(hathorNode.privateKey.substring(2), 'hex'), Buffer.from(hathorNode.chainCode.substring(2), 'hex'), hathorNode.parentFingerprint, hathorNode.depth, hathorNode.index, 'mainnet')

      wallet = new HathorWalletServiceWallet({
        requestPassword: () => Promise.resolve('123'),
        xpriv: accountPathXpriv,
        authxpriv: authPathXpriv,
        network,
        enableWs: false,
      });

      config.setWalletServiceBaseUrl(walletServiceURL);

      await wallet.start({ pinCode: '123', password: '123' });
      let address = null;
      try {
        address = await getAddress(
          {
            method: 'htr_getAddress',
            params:
              {
                type: 'first_empty',
                network: 'mainnet'
              }
          },
          wallet,
          {},
          promptHandler
        );
      } catch (e) {
        if (e instanceof PromptRejectedError) {
        } else {
          throw e;
        }
      }

      return address;
    default:
      throw new Error('Invalid request');
  }
};