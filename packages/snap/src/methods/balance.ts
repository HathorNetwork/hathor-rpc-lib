import { getBalance, PromptRejectedError } from '@hathor/hathor-rpc-handler';
import { balancePage } from '../dialogs/balance';

export const balanceHandler = async (request, wallet, origin) => {
  const tokens = request.params.tokens;
  const promptHandler = async (promptData, requestMetadata) => (
    balancePage(tokens, origin)
  )

  try {
    const balance = await getBalance(
      {
        method: 'htr_getBalance',
        params:
          {
            ...request.params,
            network: wallet.getNetwork(),
          }
      },
      wallet,
      {},
      promptHandler
    );
    return balance;
  } catch (e) {
    if (e instanceof PromptRejectedError) {
    } else {
      throw e;
    }
  }
  return null;
}