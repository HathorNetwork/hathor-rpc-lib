import { Box, Text } from '@metamask/snaps-sdk/jsx';

export const addressPage = async (origin) => (
  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: (
        <Box>
          <Text>
            The dApp {origin} wants to get your first empty address.
          </Text>
          <Text>
            Confirm the action below to continue.
          </Text>
        </Box>
      ),
    },
  })
)