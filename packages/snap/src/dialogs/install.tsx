import { Box, Text, Heading, Link } from '@metamask/snaps-sdk/jsx';

export const installPage = async () => {
  await snap.request({
    method: "snap_dialog",
    params: {
      type: "alert",
      content: (
        <Box>
          <Heading>Installation successful</Heading>
          <Text>
            To learn all possibilities read the <Link href="https://docs.hathor.network/">docs</Link>.
          </Text>
        </Box>
      ),
    },
  });
}
