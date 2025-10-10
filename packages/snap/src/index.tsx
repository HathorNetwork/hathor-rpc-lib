/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { OnRpcRequestHandler, OnInstallHandler } from '@metamask/snaps-sdk';
import { getHathorWallet } from './utils/wallet';
import { getNetworkData } from './utils/network';
import { promptHandler } from './utils/prompt';
import { installPage } from './dialogs/install';
import { handleRpcRequest } from '@hathor/hathor-rpc-handler';
import { bigIntUtils } from '@hathor/wallet-lib';

/**
 * Handle installation of the snap. This handler is called when the snap is installed
 *
 * @returns The JSON-RPC response.
 */
export const onInstall: OnInstallHandler = async () => {
  return installPage();
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
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  console.log('🔵 onRpcRequest START:', request.method);
  console.log('🔵 Origin:', origin);
  console.log('🔵 Request params:', JSON.stringify(request.params));

  try {
    // Almost all RPC requests need the network, so I add it here
    console.log('🟡 Getting network data...');
    const networkData = await getNetworkData();
    console.log('✅ Network data:', networkData);

    request.params = { ...request.params, network: networkData.network };
    console.log('🟡 Getting wallet...');
    const wallet = await getHathorWallet();
    console.log('✅ Wallet obtained');

    console.log('🟡 Handling RPC request...');
    const response = await handleRpcRequest(request, wallet, null, promptHandler(origin, wallet));
    console.log('✅ RPC response:', typeof response, JSON.stringify(response).substring(0, 200));

    // We must return the stringified response because there are some JSON responses
    // that include bigint values, which are not supported by snap
    // so we use the bigint util from the wallet lib to stringify the return
    console.log('🟡 Stringifying response...');
    const stringified = bigIntUtils.JSONBigInt.stringify(response);
    console.log('✅ Response stringified, length:', stringified.length);
    console.log('🟢 onRpcRequest COMPLETE');
    return stringified;
  } catch (error) {
    console.error('❌ ERROR in onRpcRequest:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'no stack');
    throw error;
  }
};
