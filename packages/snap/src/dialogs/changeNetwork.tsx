import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
import { Box, Card, Container, Copyable, Heading, Section, Text } from '@metamask/snaps-sdk/jsx';

export const changeNetworkPage = async (data, params, origin) => (
  await snap.request({
    method: REQUEST_METHODS.DIALOG,
    params: {
      type: DIALOG_TYPES.CONFIRMATION,
      content: (
        <Container backgroundColor='alternative'>
          <Box>
            <Heading>Change network</Heading>
            <Text>
              The dApp {origin} is requesting to change the network.
            </Text>
            <Section>
              <Card title="Current network" value="" description={params.network} />
              <Card title="New network" value="" description={params.newNetwork} />
            </Section>
          </Box>
        </Container>
      ),
    },
  })
)
