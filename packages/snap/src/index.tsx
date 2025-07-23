import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { Box, Text, Bold, Heading, Link } from '@metamask/snaps-sdk/jsx';
import { getHathorWallet } from './utils/wallet';
import { promptHandler } from './utils/prompt';
import { homePage } from './dialogs/home';
import { installPage } from './dialogs/install';
import { balanceHandler } from './methods/balance';
import { addressHandler } from './methods/address';
import { handleRpcRequest } from '@hathor/hathor-rpc-handler';

const network = 'mainnet';

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
  request.params = { ...request.params, network };
  const wallet = await getHathorWallet(network);
  return await handleRpcRequest(request, wallet, null, promptHandler(origin));
};