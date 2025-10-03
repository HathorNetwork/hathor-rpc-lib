/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
import { Box, Card, Container, Divider, Heading, Section, Text } from '@metamask/snaps-sdk/jsx';
import { renderSendTransactionContent } from './sendTransaction';
import { renderCreateTokenContent } from './createToken';
import { renderCreateNanoContent } from './createNano';
import { renderSignWithAddressContent } from './signWithAddress';
import { renderOracleDataContent } from './oracleData';
import { renderAddressContent } from './address';
import { renderBalanceContent } from './balance';
import { renderUtxosContent } from './utxos';
import { renderChangeNetworkContent } from './changeNetwork';

const getOperationTitle = (operation) => {
  const methodNames = {
    htr_sendTransaction: 'Send Transaction',
    htr_createToken: 'Create Token',
    htr_sendNanoContractTx: 'Nano Contract Transaction',
    htr_signWithAddress: 'Sign Message',
    htr_signOracleData: 'Sign Oracle Data',
    htr_getAddress: 'Get Address',
    htr_getBalance: 'Get Balance',
    htr_getUtxos: 'Get UTXOs',
    htr_changeNetwork: 'Change Network',
  };

  return methodNames[operation.method] || operation.method;
};

const renderOperationContent = (operation) => {
  const { details, params } = operation;

  if (!details || !params) return null;

  // Use the ORIGINAL params with the existing snap dialog renderers
  switch (details.type) {
    case 'sendTransaction':
      return renderSendTransactionContent(params);

    case 'createToken':
      return renderCreateTokenContent(params);

    case 'sendNanoContract':
      return renderCreateNanoContent({ parsedArgs: details.parsedArgs }, params);

    case 'signWithAddress':
      return renderSignWithAddressContent({ address: details.address, message: details.message });

    case 'signOracleData':
      return renderOracleDataContent(params);

    case 'getAddress':
      return renderAddressContent(params);

    case 'getBalance':
      return renderBalanceContent(params);

    case 'getUtxos':
      return renderUtxosContent(params);

    case 'changeNetwork':
      return renderChangeNetworkContent(params);

    default:
      return null;
  }
};

const renderOperationsList = (operations) => {
  return operations.map((operation, index) => (
    <Box key={`operation-${index}`}>
      <Section>
        <Heading>{`${index + 1}. ${getOperationTitle(operation)}`}</Heading>
        {renderOperationContent(operation)}
      </Section>
      {index < operations.length - 1 ? <Divider /> : null}
    </Box>
  ));
};

export const batchRequestsPage = async (data, params, origin) => (
  await snap.request({
    method: REQUEST_METHODS.DIALOG,
    params: {
      type: DIALOG_TYPES.CONFIRMATION,
      content: (
        <Container backgroundColor='alternative'>
          <Box>
            <Heading>Batch Request</Heading>
            <Text>
              The dApp {origin} is requesting permission to execute {data.operations.length} operations in a batch.
            </Text>
            <Text>
              You will only need to approve once and enter your PIN once for all operations.
            </Text>
            {data.errorHandling && (
              <Card title="Error Handling" value="" description={data.errorHandling} />
            )}
            <Divider />
            {renderOperationsList(data.operations)}
          </Box>
        </Container>
      ),
    },
  })
);
