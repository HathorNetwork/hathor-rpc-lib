import { Box, Text } from '@metamask/snaps-sdk/jsx';
import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';

export const addressPage = async () => (
  await snap.request({
    method: REQUEST_METHODS.DIALOG,
    params: {
      type: DIALOG_TYPES.CONFIRMATION,
      content: (
        <Box>
          <Text>
            The dApp wants to get your first empty address.
          </Text>
          <Text>
            Confirm the action below to continue.
          </Text>
        </Box>
      ),
    },
  })
)