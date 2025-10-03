/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
import { Bold, Box, Container, Divider, Heading, Section, Text } from '@metamask/snaps-sdk/jsx';

const renderOperationDescription = (operation) => {
  const methodNames = {
    htr_sendTransaction: 'Send Transaction',
    htr_createToken: 'Create Token',
    htr_sendNanoContractTx: 'Send Nano Contract Transaction',
    htr_signWithAddress: 'Sign Message',
    htr_signOracleData: 'Sign Oracle Data',
    htr_getAddress: 'Get Address',
    htr_getBalance: 'Get Balance',
    htr_getUtxos: 'Get UTXOs',
    htr_changeNetwork: 'Change Network',
  };

  return methodNames[operation.method] || operation.method;
};

const renderOperationsList = (operations) => {
  return operations.map((operation, index) => (
    <Box key={`operation-${index}`}>
      <Text>{`${index + 1}. ${renderOperationDescription(operation)}`}</Text>
      {operation.description && <Text>{operation.description}</Text>}
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
            <Section>
              <Text><Bold>Operations ({data.operations.length})</Bold></Text>
              <Divider />
              {renderOperationsList(data.operations)}
            </Section>
            {data.errorHandling && (
              <Box>
                <Text><Bold>Error Handling:</Bold> {data.errorHandling}</Text>
              </Box>
            )}
            <Box>
              <Text>
                You will only need to approve once and enter your PIN once for all operations.
              </Text>
            </Box>
          </Box>
        </Container>
      ),
    },
  })
);
