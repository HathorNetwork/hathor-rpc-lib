/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
import { Box, Container, Copyable, Heading, Section, Text } from '@metamask/snaps-sdk/jsx';

export const xpubPage = async (data, params, origin) => (
  await snap.request({
    method: REQUEST_METHODS.DIALOG,
    params: {
      type: DIALOG_TYPES.CONFIRMATION,
      content: (
        <Container backgroundColor='alternative'>
          <Box>
            <Heading>Request Extended Public Key</Heading>
            <Text>
              The dApp {origin} is requesting your wallet's extended public key (xpub).
            </Text>
            <Text>
              The xpub allows the dApp to derive all your public addresses without accessing your private keys.
            </Text>
            <Section>
              <Text>Extended Public Key:</Text>
              <Copyable value={data.xpub} />
            </Section>
          </Box>
        </Container>
      ),
    },
  })
)
