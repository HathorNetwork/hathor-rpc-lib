/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
import { renderCreateTokenData } from './common';
import { Box, Container, Heading, Text } from '@metamask/snaps-sdk/jsx';

export const createTokenPage = async (data, params, origin) => (
  await snap.request({
    method: REQUEST_METHODS.DIALOG,
    params: {
      type: DIALOG_TYPES.CONFIRMATION,
      content: (
        <Container backgroundColor="alternative">
          <Box>
            <Heading>Create new token</Heading>
            <Text>
              The dApp {origin} is requesting permission to create a new token on the Hathor Network with the following details:
            </Text>
            {renderCreateTokenData(params)}
          </Box>
        </Container>
      ),
    },
  })
)
