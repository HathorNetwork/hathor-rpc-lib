import { getAddress, PromptRejectedError } from '@hathor/hathor-rpc-handler';
import { addressPage } from '../dialogs/address';

export const addressHandler = async (request, wallet, origin) => {
  const promptHandler = async (promptData, requestMetadata) => (
    addressPage(origin)
  )

  try {
    const address = await getAddress(
      {
        method: 'htr_getAddress',
        params:
          {
            type: 'first_empty',
            network: wallet.getNetwork(),
          }
      },
      wallet,
      {},
      promptHandler
    );
    return address;
  } catch (e) {
    if (e instanceof PromptRejectedError) {
    } else {
      throw e;
    }
  }

  return null;
}