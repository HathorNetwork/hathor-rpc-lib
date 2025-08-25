import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { Box, Text, Bold, Heading, Link } from '@metamask/snaps-sdk/jsx';
import { getHathorWallet } from './utils/wallet';
import { getNetworkData } from './utils/network';
import { promptHandler } from './utils/prompt';
import { homePage } from './dialogs/home';
import { installPage } from './dialogs/install';
import { balanceHandler } from './methods/balance';
import { addressHandler } from './methods/address';
import { handleRpcRequest } from '@hathor/hathor-rpc-handler';
import { bigIntUtils } from '@hathor/wallet-lib';

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
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  // Almost all RPC requests need the network, so I add it here
  const networkData = await getNetworkData();
  request.params = { ...request.params, network: networkData.network };
  const wallet = await getHathorWallet();
  const response = await handleRpcRequest(request, wallet, null, promptHandler(origin, wallet));
  // We must return the stringified response because there are some JSON responses
  // that include bigint values, which are not supported by snap
  // so we use the bigint util from the wallet lib to stringify the return
  return bigIntUtils.JSONBigInt.stringify(response);
};