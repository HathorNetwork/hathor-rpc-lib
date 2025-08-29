/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
import { Box, Container, Heading, Text } from '@metamask/snaps-sdk/jsx';
import { renderNanoData } from './common';

export const createNanoPage = async (data, params, origin) => (
  await snap.request({
    method: REQUEST_METHODS.DIALOG,
    params: {
      type: DIALOG_TYPES.CONFIRMATION,
      content: (
        <Container backgroundColor="alternative">
          <Box>
            <Heading>Send Nano Contract Transaction</Heading>
            <Text>
              The dApp {origin} is requesting permission to execute a nano contract transaction on the Hathor Network
            </Text>
            {renderNanoData(data)}
          </Box>
        </Container>
      ),
    },
  })
)
