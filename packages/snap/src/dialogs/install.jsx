/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
import { Box, Container, Link, Heading, Text } from '@metamask/snaps-sdk/jsx';

export const installPage = async () => {
  console.log('🔵 installPage START');

  try {
    console.log('🟡 Creating JSX content...');
    const content = (
      <Container backgroundColor='alternative'>
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
    );
    console.log('✅ JSX content created, type:', typeof content);
    console.log('🔵 JSX content:', JSON.stringify(content).substring(0, 200));

    console.log('🟡 Calling snap.request with dialog...');
    const result = await snap.request({
      method: REQUEST_METHODS.DIALOG,
      params: {
        type: DIALOG_TYPES.ALERT,
        content,
      },
    });
    console.log('✅ Dialog result:', result);
    console.log('🟢 installPage COMPLETE');
    return result;
  } catch (error) {
    console.error('❌ ERROR in installPage:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'no stack');
    throw error;
  }
}
