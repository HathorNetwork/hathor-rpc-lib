import { Bold, Box, Container, Heading, Section, Text } from '@metamask/snaps-sdk/jsx';
import { numberUtils } from '@hathor/wallet-lib';

export const sendTransactionPage = async (data, params, origin) => (
  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: (
        <Container backgroundColor='alternative'>
          <Box>
            <Heading>Send transaction</Heading>
            <Text>
              The dApp {origin} is requesting permission to view the list of unspent transaction outputs (UTXOs) of your Hathor wallet with the following parameters:
            </Text>
            <Section>
              <Text><Bold>Parameters</Bold></Text>
              <Divider />
              <Card title='Address' value={params.filter_address} />
              <Card title='Token' value={params.token} />
              <Card title='Authorities' value={params.authorities} />
              <Card title='Maximum count' value={params.max_utxos} />
              <Card title='Maximum amount' value={params.max_amount} />
              <Card title='Amount smaller than' value={params.amount_smaller_than} />
              <Card title='Amount bigger than' value={params.amount_bigger_than} />
              <Card title='Only available?' value={params.only_available_utxos ? 'Yes' : 'No'} />
            </Section>
            <Section>
              <Text><Bold>UTXOs Summary</Bold></Text>
              <Divider />
              <Card title='Total count of utxos available' value={data.total_utxos_available} />
              <Card title='Total amount in the utxos' value={data.total_amount_available} />
            </Section>
          </Box>
        </Container>
      ),
    },
  })
)