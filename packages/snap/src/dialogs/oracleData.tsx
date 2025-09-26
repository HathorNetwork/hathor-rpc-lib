/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
import { Bold, Box, Card, Container, Copyable, Heading, Section, Text } from '@metamask/snaps-sdk/jsx';

export const oracleDataPage = async (data, params, origin) => (
  await snap.request({
    method: REQUEST_METHODS.DIALOG,
    params: {
      type: DIALOG_TYPES.CONFIRMATION,
      content: (
        <Container backgroundColor="alternative">
          <Box>
            <Heading>Sign data with oracle</Heading>
            <Text>
              The dApp {origin} is requesting permission to get an oracle signature from your wallet
            </Text>
            <Section>
              <Bold>Nano Contract ID</Bold>
              <Copyable value={params.nc_id} />
              <Card title="Oracle" value="" description={params.oracle} />
              <Card title="Data" value="" description={params.data} />
            </Section>
          </Box>
        </Container>
      ),
    },
  })
)