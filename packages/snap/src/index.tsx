/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { OnRpcRequestHandler, OnInstallHandler, OnUpdateHandler } from '@metamask/snaps-sdk';
import { getHathorWallet, initializeWalletOnService } from './utils/wallet';
import { getNetworkData } from './utils/network';
import { promptHandler } from './utils/prompt';
import { installPage } from './dialogs/install';
import { handleRpcRequest } from '@hathor/hathor-rpc-handler';
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
