import { Bold, Box, Container, Heading, Section, Text } from '@metamask/snaps-sdk/jsx';
import { numberUtils } from '@hathor/wallet-lib';

export const signWithAddressPage = async (data, params, origin) => (
  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: (
        <Container backgroundColor='alternative'>
          <Box>
            <Heading>Sign data with address</Heading>
            <Text>
              The dApp {origin} is requesting your signature on a message using your Hathor wallet address.
            </Text>
            <Section>
              <Card title='Address' value={data.address.address} />
              <Card title='Message' value={data.message} />
            </Section>
          </Box>
        </Container>
      ),
    },
  })
)
