/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Section, Text } from '@metamask/snaps-sdk/jsx';

export const PushTxWarning = ({ pushTx }) => {
  if (pushTx !== false) {
    return null;
  }

  return (
    <Section>
      <Text>
        This transaction will only be built, not pushed to the network.
      </Text>
    </Section>
  );
};
