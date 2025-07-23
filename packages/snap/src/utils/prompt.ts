import { addressPage, balancePage } from '../dialogs';
import { RpcMethods } from '@hathor/hathor-rpc-handler';

export const promptHandler = (origin) => async (promptRequest) => {
  const data = promptRequest.data;
  const params = promptRequest.params;
  let confirmed;
  switch (promptRequest.method) {
    case RpcMethods.GetAddress:
      confirmed = await addressPage(data, params, origin);
      break;
    case RpcMethods.GetBalance:
      confirmed = await balancePage(data, params, origin);
      break;
    default:
      throw new Error('Invalid request');
  }

  return { data: confirmed };
}