/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
import { Box, Container, Link, Heading, Text } from '@metamask/snaps-sdk/jsx';

export const installPage = async () => (
  await snap.request({
    method: REQUEST_METHODS.DIALOG,
    params: {
      type: DIALOG_TYPES.ALERT,
      content: (
        <Container>
          <Box>
            <Heading>Installation successful</Heading>
            <Text>
              You can access the full documentation on the <Link href="https://docs.hathor.network/explanations/features/metamask-snap">Hathor docs</Link>
            </Text>
            <Text>
              The dApp you are connecting to will have access to your first address and the network you are connected to
            </Text>
          </Box>
        </Container>
      ),
    },
  })
)
