/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
import { Container, Text } from '@metamask/snaps-sdk/jsx';

export const xpubPage = async (_data, _params, _origin) => {
  const result = await snap.request({
    method: REQUEST_METHODS.DIALOG,
    params: {
      type: DIALOG_TYPES.CONFIRMATION,
      content: (
        <Container backgroundColor='alternative'>
          <Text>
            oi
          </Text>
        </Container>
      )
    },
  });
  return result;
}
