import { Box, Text } from '@metamask/snaps-sdk/jsx';
import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';

export const balancePage = async (data) => (
  await snap.request({
    method: REQUEST_METHODS.DIALOG,
    params: {
      type: DIALOG_TYPES.CONFIRMATION,
      content: (
        <Box>
          <Text>
            The dApp wants to get the balance of the following tokens:
          </Text>
          <Text>
            Tokens from data
          </Text>
          <Text>
            Confirm the action below to continue.
          </Text>
        </Box>
      ),
    },
  })
)