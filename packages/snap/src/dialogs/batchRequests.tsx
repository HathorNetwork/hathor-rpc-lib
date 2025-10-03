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
      return renderSendTransactionContent(null, params);

    case 'createToken':
      return renderCreateTokenContent(params);

    case 'sendNanoContract':
      return renderCreateNanoContent({ parsedArgs: details.parsedArgs }, params);

    case 'signWithAddress':
      return renderSignWithAddressContent({ address: details.address, message: details.message });

    case 'signOracleData':
      return (
        <Section>
          <Card title="Oracle" value="" description={params.oracle} />
          <Card title="Data" value="" description={params.data} />
        </Section>
      );

    case 'getAddress':
      return (
        <Section>
          <Card title="Type" value="" description={params.type || (params.index !== undefined ? `Index ${params.index}` : 'Unknown')} />
        </Section>
      );

    case 'getBalance':
      return (
        <Section>
          <Card title="Tokens" value="" description={params.tokens?.join(', ') || 'All tokens'} />
        </Section>
      );

    case 'getUtxos':
      return (
        <Section>
          {params.token && <Card title="Token" value="" description={params.token} />}
          {params.maxUtxos && <Card title="Max UTXOs" value="" description={params.maxUtxos.toString()} />}
        </Section>
      );

    case 'changeNetwork':
      return (
        <Section>
          <Card title="New Network" value="" description={params.newNetwork} />
        </Section>
      );

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
