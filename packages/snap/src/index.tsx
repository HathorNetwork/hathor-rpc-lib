/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { OnRpcRequestHandler, OnInstallHandler, OnUpdateHandler } from '@metamask/snaps-sdk';
import { getHathorWallet, getReadOnlyHathorWallet, initializeWalletOnService } from './utils/wallet';
import { getNetworkData } from './utils/network';
import { promptHandler } from './utils/prompt';
import { installPage } from './dialogs/install';
import { handleRpcRequest, RpcMethods } from '@hathor/hathor-rpc-handler';
import { bigIntUtils } from '@hathor/wallet-lib';

/**
 * Handle installation of the snap. This handler is called when the snap is installed
 *
 * @returns The JSON-RPC response.
 */
export const onInstall: OnInstallHandler = async () => {
  try {
    console.log('🟡 onInstall: Initializing wallet on wallet-service (non-blocking)...');

    // Initialize wallet on wallet-service without waiting for it to be ready
    // This uses waitReady: false internally
    const walletId = await initializeWalletOnService();

    console.log('✅ onInstall: Wallet creation started on wallet-service');
    console.log('✅ onInstall: Wallet ID:', walletId);
  } catch (error) {
    console.error('❌ onInstall: Failed to initialize wallet:', error);
    // Don't throw - show installation page even if wallet init fails
  }

  return installPage();
};

/**
 * Handle snap updates. This handler is called when the snap is updated to a new version.
 *
 * We also initialize the wallet here to ensure it exists on the wallet-service after updates.
 * This is useful for testing and ensures the wallet is available even if onInstall didn't run.
 */
export const onUpdate: OnUpdateHandler = async () => {
  try {
    console.log('🟡 onUpdate: Initializing wallet on wallet-service (non-blocking)...');

    // Initialize wallet on wallet-service without waiting for it to be ready
    const walletId = await initializeWalletOnService();

    console.log('✅ onUpdate: Wallet creation started on wallet-service');
    console.log('✅ onUpdate: Wallet ID:', walletId);
  } catch (error) {
    console.error('❌ onUpdate: Failed to initialize wallet:', error);
    // Don't throw - continue with update even if wallet init fails
  }
};

// RPC methods that only require read-only access (no signing)
const READ_ONLY_METHODS = new Set([
  RpcMethods.GetBalance,
  RpcMethods.GetAddress,
  RpcMethods.GetUtxos,
  RpcMethods.GetConnectedNetwork,
  RpcMethods.GetXpub,
  RpcMethods.GetWalletInformation,
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
  request.params = { ...request.params, network: networkData.network };

  // Use read-only wallet for requests that don't require signing
  const isReadOnly = READ_ONLY_METHODS.has(request.method as RpcMethods);
  const wallet = isReadOnly
    ? await getReadOnlyHathorWallet()
    : await getHathorWallet();

  const response = await handleRpcRequest(request, wallet, null, promptHandler(origin, wallet));
  // We must return the stringified response because there are some JSON responses
  // that include bigint values, which are not supported by snap
  // so we use the bigint util from the wallet lib to stringify the return
  return bigIntUtils.JSONBigInt.stringify(response);
};