/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Bold, Box, Divider, Text } from '@metamask/snaps-sdk/jsx';
import { constants as libConstants, numberUtils } from '@hathor/wallet-lib';

export const formatHtrAmount = (amount?: bigint): string => {
  if (amount === undefined || amount === 0n) {
    return '-';
  }
  return `${numberUtils.prettyValue(amount)} ${libConstants.DEFAULT_NATIVE_TOKEN_CONFIG.symbol}`;
}

export const NetworkFee = ({ networkFee, showDivider = false }: { networkFee?: bigint; showDivider?: boolean }) => {
  return (
    <Box>
      {showDivider ? <Divider /> : null}
      <Text><Bold>Network fee:</Bold> {formatHtrAmount(networkFee)}</Text>
    </Box>
  );
}
