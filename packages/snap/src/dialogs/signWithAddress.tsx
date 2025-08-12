import { Bold, Box, Copyable, Container, Heading, Section, Text } from '@metamask/snaps-sdk/jsx';

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
              <Bold>Address</Bold>
              <Text>Index {data.address.index.toString()}</Text>
              <Copyable value={data.address.address} />
            </Section>
            <Section>
              <Bold>Message</Bold>
              <Text>{data.message}</Text>
            </Section>
          </Box>
        </Container>
      ),
    },
  })
)
