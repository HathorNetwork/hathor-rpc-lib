/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { OnRpcRequestHandler, OnInstallHandler } from '@metamask/snaps-sdk';
import { SnapError } from '@metamask/snaps-sdk';
import { getHathorWallet, getReadOnlyHathorWallet, initializeWalletOnService } from './utils/wallet';
import { getNetworkData } from './utils/network';
import { promptHandler } from './utils/prompt';
import { installPage } from './dialogs/install';
import { handleRpcRequest, RpcMethods } from '@hathor/hathor-rpc-handler';
import { bigIntUtils } from '@hathor/wallet-lib';

/**
 * Handle installation of the snap. This handler is called when the snap is installed
 *
 * We initialize the wallet on the wallet-service during installation so it's available
 * for read-only access from the web wallet immediately.
 *
 * Using waitReady: false means we don't block the installation waiting for the wallet
 * to be fully ready. The wallet will be created on the wallet-service in the background
 * and will be available for read-only access once it's ready.
 *
 * @returns The JSON-RPC response.
 */
export const onInstall: OnInstallHandler = async () => {
  let walletInitSuccess = false;
  try {
    // Initialize wallet on wallet-service without waiting for it to be ready
    // This uses waitReady: false internally
    await initializeWalletOnService();
    walletInitSuccess = true;
  } catch (error) {
    console.error('onInstall: Failed to initialize wallet:', error);
    // Store initialization failure in snap state for retry on first RPC call
    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: {
          walletInitFailed: true,
          initError: error instanceof Error ? error.message : String(error),
        },
      },
    });
  }

  return installPage(walletInitSuccess);
};

// RPC methods that only require read-only access (no signing)
const READ_ONLY_METHODS = new Set([
  RpcMethods.GetBalance,
  RpcMethods.GetAddress,
  RpcMethods.GetUtxos,
  RpcMethods.GetConnectedNetwork,
  RpcMethods.GetXpub,
  RpcMethods.GetWalletInformation,
  RpcMethods.ChangeNetwork,
]);

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

  request.params = {
    ...request.params,
    network: networkData.network,
  };

  // Use read-only wallet for requests that don't require signing
  const isReadOnly = READ_ONLY_METHODS.has(request.method as RpcMethods);

  const wallet = isReadOnly
    ? await getReadOnlyHathorWallet()
    : await getHathorWallet();

  try {
    const response = await handleRpcRequest(request, wallet, null, promptHandler(origin, wallet));
    // We must return the stringified response because there are some JSON responses
    // that include bigint values, which are not supported by snap
    // so we use the bigint util from the wallet lib to stringify the return
    return bigIntUtils.JSONBigInt.stringify(response);
  } catch (e: any) {
    // Re-throw using SnapError to properly serialize the data property
    const snapError = new SnapError(
      e.message || 'Unknown error',
      e.data || { errorType: e.name || 'UnknownError' }
    );
    // Try to preserve the original error code
    if (e.code) {
      (snapError as any).code = e.code;
    }
    throw snapError;
  }
};
