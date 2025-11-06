/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
import { Box, Container, Copyable, Heading, Section, Text } from '@metamask/snaps-sdk/jsx';

const renderParamText = (params) => {
  switch (params.type) {
    case 'first_empty':
      return 'First empty address'
    case 'index':
      return `Address at index ${params.index}`
    default:
      return 'Unsupported type'
  }
}

const renderAddressIndex = (data, params) => {
  if (params.type === 'index') {
    // We already show the address index at the params box
    return null;
  }

  return (
    <Text>
      Address at index {data.index.toString()}
    </Text>
  );
}

export const addressPage = async (data, params, origin) => (
  await snap.request({
    method: REQUEST_METHODS.DIALOG,
    params: {
      type: DIALOG_TYPES.CONFIRMATION,
      content: (
        <Container backgroundColor='alternative'>
          <Box>
            <Heading>Request address</Heading>
            <Text>
              The dApp {origin} is requesting your public address.
            </Text>
            <Section>
              <Text>{renderParamText(params)}</Text>
            </Section>
            <Text>
              The following address will be shared if the request is confirmed.
            </Text>
            <Section>
              {renderAddressIndex(data, params)}
              <Copyable value={data.address} />
            </Section>
          </Box>
        </Container>
      ),
    },
  })
)
