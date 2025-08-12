import { addressPage, balancePage, createNanoPage, createTokenPage, sendTransactionPage, signWithAddressPage, utxosPage } from '../dialogs';
import { RpcMethods, TriggerTypes } from '@hathor/hathor-rpc-handler';

export const promptHandler = (origin, wallet) => async (promptRequest) => {
  const data = promptRequest.data;
  const params = promptRequest.params;
  let approved;
  switch (promptRequest.type) {
    case TriggerTypes.SignMessageWithAddressConfirmationPrompt:
      approved = await signWithAddressPage(data, params, origin);
      return { data: approved };
    case TriggerTypes.PinConfirmationPrompt:
      return {
        data: {
          accepted: true,
          pinCode: '123',
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
      const response = {
        data: {
          accepted: approved
        }
      }

      if (!approved) {
        return response;
      }

      // For the snap, the nano caller is always the address0
      const address0 = await wallet.getAddressAtIndex(0);
      response['data']['nc'] = {
        caller: address0,
        blueprintId: params.blueprint_id,
        actions: params.actions,
        args: params.args,
      };
      return response;
    case TriggerTypes.SendNanoContractTxLoadingTrigger:
    case TriggerTypes.SendNanoContractTxLoadingFinishedTrigger:
    case TriggerTypes.CreateTokenLoadingTrigger:
    case TriggerTypes.CreateTokenLoadingFinishedTrigger:
    case TriggerTypes.SendTransactionLoadingTrigger:
    case TriggerTypes.SendTransactionLoadingFinishedTrigger:
      break;
    default:
      throw new Error('Invalid request');
  }
}