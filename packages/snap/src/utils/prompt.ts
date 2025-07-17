import { addressPage, balancePage } from '../dialogs';
import { RpcMethods } from '@hathor/hathor-rpc-handler';

export const promptHandler = async (data) => {
  switch (data.method) {
    case RpcMethods.GetAddress:
      return addressPage(data);
    case RpcMethods.GetBalance:
      return balancePage(data);
    default:
      throw new Error('Invalid request');
  }
}