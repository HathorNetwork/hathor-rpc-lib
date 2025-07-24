import { Bold, Box, Container, Heading, Section, Text } from '@metamask/snaps-sdk/jsx';
import { numberUtils } from '@hathor/wallet-lib';

const renderInputs = (inputs) => {
  return inputs.map((input) => (
    <Card title={input.txId} value=`Index ${input.index}` />
  ));
}

const renderOutputs = (outputs) => {
  return outputs.map((output) => {
    if (output.type === 'data') {
      return <Card title="Data outputs" description={output.data.join('\n')} />
    }
    
    return <Card title={output.address}
                 value={numberUtils.prettyValue(output.value)}
                 extra={output.token} />
  });
}

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
              The dApp {origin} is requesting permission to send a transaction from your Hathor wallet.
            </Text>
            <Section>
              <Text><Bold>Transaction preview</Bold></Text>
              <Text><Bold>Inputs</Bold></Text>
              <Divider />
              {renderInputs(data.inputs)}
              <Text><Bold>Outputs</Bold></Text>
              <Divider />
              {renderOutputs(data.outputs)}
              <Text><Bold>Change address</Bold></Text>
              <Divider />
              {data.changeAddress}
            </Section>
          </Box>
        </Container>
      ),
    },
  })
)