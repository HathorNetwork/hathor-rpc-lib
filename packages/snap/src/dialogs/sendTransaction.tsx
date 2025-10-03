/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
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
    if (output.data) {
      return (
        <Box key={`output-${index}`}>
          <Text>Data output</Text>
          <Text>{output.data}</Text>
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

export const renderSendTransactionContent = (params) => (
  <Section>
    <Text><Bold>Transaction preview</Bold></Text>
    {renderInputs(params.inputs)}
    <Text><Bold>Outputs</Bold></Text>
    <Divider />
    {renderOutputs(params.outputs)}
    {renderChangeAddress(params.changeAddress)}
  </Section>
);

export const sendTransactionPage = async (data, params, origin) => (
  await snap.request({
    method: REQUEST_METHODS.DIALOG,
    params: {
      type: DIALOG_TYPES.CONFIRMATION,
      content: (
        <Container backgroundColor='alternative'>
          <Box>
            <Heading>Send transaction</Heading>
            <Text>
              The dApp {origin} is requesting permission to send a transaction from your Hathor wallet.
            </Text>
            {renderSendTransactionContent(params)}
          </Box>
        </Container>
      ),
    },
  })
)