import { Bold, Box, Card, Container, Divider, Heading, Section, Text } from '@metamask/snaps-sdk/jsx';
import { constants as libConstants, numberUtils, helpersUtils } from '@hathor/wallet-lib';

const renderInputs = (inputs) => {
  if (!inputs) {
    return null;
  }

  return (
    <Box>
      <Text><Bold>Inputs</Bold></Text>
      <Divider />
      {renderInputsList(inputs)}
    </Box>
  );

}

const renderInputsList = (inputs) => {
  return inputs.map((input, index) => (
    <Box key={`input-${index}`}>
      <Text>{helpersUtils.getShortHash(input.txId)}</Text>
      <Text>Index {input.index.toString()}</Text>
    </Box>
  ));
}

// We show the symbol only if it's HTR in the list
const renderTokenSymbol = (token) => {
  if (!token || token === libConstants.NATIVE_TOKEN_UID) {
    return libConstants.DEFAULT_NATIVE_TOKEN_CONFIG.symbol;
  }

  return '';
}

const renderTokenId = (token) => {
  if (!token || token === libConstants.NATIVE_TOKEN_UID) {
    return null;
  }

  return <Text>{helpersUtils.getShortHash(token)}</Text>;
}

const renderOutputs = (outputs) => {
  return outputs.map((output, index) => {
    if (output.type === 'data') {
      return (
        <Box key={`output-${index}`}>
          <Text>Data output</Text>
          <Text>{output.data.join('\n')}</Text>
        </Box>
      );
    }
    
    return (
      <Box key={`output-${index}`}>
        <Text>{output.address}</Text>
        <Text>{`${numberUtils.prettyValue(output.value)} ${renderTokenSymbol(output.token)}`}</Text>
        {renderTokenId(output.token)}
        {index < outputs.length - 1 ? <Divider /> : null}
      </Box>
    );
  });
}

const renderChangeAddress = (changeAddress) => {
  if (!changeAddress) {
    return null;
  }

  return (
    <Box>
      <Text><Bold>Change address</Bold></Text>
      <Divider />
      <Text>{changeAddress}</Text>
    </Box>
  );
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
              {renderInputs(params.inputs)}
              <Text><Bold>Outputs</Bold></Text>
              <Divider />
              {renderOutputs(params.outputs)}
              {renderChangeAddress(params.changeAddress)}
            </Section>
          </Box>
        </Container>
      ),
    },
  })
)