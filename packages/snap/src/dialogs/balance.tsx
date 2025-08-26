/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
import { Box, Card, Container, Divider, Heading, Section, Text } from '@metamask/snaps-sdk/jsx';
import { numberUtils } from '@hathor/wallet-lib';

const renderBalances = (data) => {
  return data.map((tokenData) => (
    <Card title={tokenData.token.symbol} value={numberUtils.prettyValue(tokenData.balance.unlocked)} />
  ))
}

export const balancePage = async (data, params, origin) => (
  await snap.request({
    method: REQUEST_METHODS.DIALOG,
    params: {
      type: DIALOG_TYPES.CONFIRMATION,
      content: (
        <Container backgroundColor="alternative">
          <Box>
            <Heading>Check balance</Heading>
            <Text>
              The dApp {origin} is requesting permission to view the current balance of the following tokens in your Hathor wallet:
            </Text>
            <Section>
              <Card title="Token" value="Balance" />
              <Divider />
              {renderBalances(data)} 
            </Section>
          </Box>
        </Container>
      ),
    },
  })
)