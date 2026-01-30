/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
import { Bold, Box, Container, Divider, Heading, Icon, Section, Text, Tooltip } from '@metamask/snaps-sdk/jsx';
import { constants as libConstants, numberUtils, helpersUtils } from '@hathor/wallet-lib';
import { PushTxWarning } from '../components';

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

const renderTokenAmountSymbol = (output, tokenDetails) => {
  const tokenUid = output.token;
  if (!tokenUid || tokenUid === libConstants.NATIVE_TOKEN_UID) {
    return <Text>{`${numberUtils.prettyValue(output.value)} ${libConstants.DEFAULT_NATIVE_TOKEN_CONFIG.symbol}`}</Text>;
  }

  if (!tokenDetails.has(tokenUid)) {
    return '';
  }

  const tokenInfo = tokenDetails.get(tokenUid);

  return (
    <Tooltip
      content={
        <Text>
          <Bold>{tokenInfo.tokenInfo.name}</Bold>
          {' '}({tokenUid})
        </Text>
      }
    >
      <Text>
        {`${numberUtils.prettyValue(output.value)} ${tokenInfo.tokenInfo.symbol} `}
        <Icon name="info" />
      </Text>
    </Tooltip>
  );
}

const renderOutputs = (outputs, tokenDetails) => {
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
        {renderTokenAmountSymbol(output, tokenDetails)}
        {output.timelock && (
          <Text>
            <Bold>Timelock:</Bold> {new Date(output.timelock * 1000).toLocaleString()}
          </Text>
        )}
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
            <Section>
              <Text><Bold>Transaction preview</Bold></Text>
              {renderInputs(params.inputs)}
              <Text><Bold>Outputs</Bold></Text>
              <Divider />
              {renderOutputs(params.outputs, data.tokenDetails)}
              {renderChangeAddress(params.changeAddress)}
            </Section>
            <PushTxWarning pushTx={data.pushTx} />
          </Box>
        </Container>
      ),
    },
  })
)