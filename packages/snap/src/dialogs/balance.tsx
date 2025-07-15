import { Box, Text } from '@metamask/snaps-sdk/jsx';

export const balancePage = async (data) => (
  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
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