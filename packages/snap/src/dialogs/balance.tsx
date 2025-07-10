import { Box, Text } from '@metamask/snaps-sdk/jsx';

export const balancePage = async (tokens, origin) => (
  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: (
        <Box>
          <Text>
            The dApp {origin} wants to get the balance of the following tokens:
          </Text>
          <Text>
            {tokens.join(", ")}
          </Text>
          <Text>
            Confirm the action below to continue.
          </Text>
        </Box>
      ),
    },
  })
)