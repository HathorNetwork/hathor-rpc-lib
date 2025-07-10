import type { OnHomePageHandler, OnInstallHandler, OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { Box, Text, Bold, Heading, Link } from '@metamask/snaps-sdk/jsx';
import { getHathorWallet } from './utils/wallet';
import { homePage } from './dialogs/home';
import { installPage } from './dialogs/install';
import { balanceHandler } from './methods/balance';
import { addressHandler } from './methods/address';

const network = 'mainnet';

// This is the snap home page
export const onHomePage: OnHomePageHandler = homePage;

// This page is shown after the snap is installed
export const onInstall: OnInstallHandler = installPage;

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
  // eslint-disable-next-line
  const wallet = await getHathorWallet(network);
  switch (request.method) {
    case 'balance':
      return balanceHandler(request, wallet, origin);
    case 'address':
      return addressHandler(request, wallet, origin);
    default:
      throw new Error('Invalid request');
  }
};