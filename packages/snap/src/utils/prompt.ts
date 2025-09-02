/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  addressPage,
  balancePage,
  changeNetworkPage,
  createNanoPage,
  createTokenPage,
  createNanoAndTokenPage,
  oracleDataPage,
  sendTransactionPage,
  signWithAddressPage,
  utxosPage
} from '../dialogs';
import { setNetwork } from '../utils/network';
import { DEFAULT_PIN_CODE, NETWORK_MAP } from '../constants';
import { RpcMethods, TriggerTypes } from '@hathor/hathor-rpc-handler';

export const promptHandler = (origin, wallet) => async (promptRequest) => {
  const data = promptRequest.data;
  const params = promptRequest.params;
  let approved, response, address0;
  switch (promptRequest.type) {
    case TriggerTypes.SignMessageWithAddressConfirmationPrompt:
      approved = await signWithAddressPage(data, params, origin);
      return { data: approved };
    case TriggerTypes.PinConfirmationPrompt:
      return {
        data: {
          accepted: true,
          pinCode: DEFAULT_PIN_CODE,
        }
      };
    case TriggerTypes.GetBalanceConfirmationPrompt:
      approved = await balancePage(data, params, origin);
      return { data: approved };
    case TriggerTypes.AddressRequestPrompt:
      approved = await addressPage(data, params, origin);
      return { data: approved };
    case TriggerTypes.GetUtxosConfirmationPrompt:
      approved = await utxosPage(data, params, origin);
      return { data: approved };
    case TriggerTypes.ChangeNetworkConfirmationPrompt:
      if (!(params.newNetwork in NETWORK_MAP)) {
        // Reject if the newNetwork is not a valid option
        return { data: false };
      }

      approved = await changeNetworkPage(data, params, origin);
      if (approved) {
        await setNetwork(data.newNetwork);
      }
      return { data: approved };
    case TriggerTypes.SendTransactionConfirmationPrompt:
      approved = await sendTransactionPage(data, params, origin);
      return {
        data: {
          accepted: approved
        }
      };
    case TriggerTypes.CreateTokenConfirmationPrompt:
      approved = await createTokenPage(data, params, origin);
      return {
        data: {
          accepted: approved
        }
      };
    case TriggerTypes.SendNanoContractTxConfirmationPrompt:
      approved = await createNanoPage(data, params, origin);
      response = {
        data: {
          accepted: approved
        }
      }

      if (!approved) {
        return response;
      }

      // For the snap, the nano caller is always the address0
      address0 = await wallet.getAddressAtIndex(0);
      response['data']['nc'] = {
        caller: address0,
        blueprintId: params.blueprint_id,
        actions: params.actions,
        args: params.args,
      };
      return response;
    case TriggerTypes.SignOracleDataConfirmationPrompt:
      approved = await oracleDataPage(data, params, origin);
      return { data: approved };
    case TriggerTypes.CreateNanoContractCreateTokenTxConfirmationPrompt:
      approved = await createNanoAndTokenPage(data, params, origin);
      response = {
        data: {
          accepted: approved
        }
      }

      if (!approved) {
        return response;
      }

      // For the snap, the nano caller is always the address0
      address0 = await wallet.getAddressAtIndex(0);
      response['data']['nano'] = { ...data.nano, caller: address0 };
      response['data']['token'] = { ...data.token };
      return response;

    case TriggerTypes.SendNanoContractTxLoadingTrigger:
    case TriggerTypes.SendNanoContractTxLoadingFinishedTrigger:
    case TriggerTypes.CreateTokenLoadingTrigger:
    case TriggerTypes.CreateTokenLoadingFinishedTrigger:
    case TriggerTypes.SendTransactionLoadingTrigger:
    case TriggerTypes.SendTransactionLoadingFinishedTrigger:
    case TriggerTypes.CreateNanoContractCreateTokenTxLoadingTrigger:
    case TriggerTypes.CreateNanoContractCreateTokenTxLoadingFinishedTrigger:
      break;
    default:
      throw new Error('Invalid request');
  }
}