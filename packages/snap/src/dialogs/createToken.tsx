/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
import { Box, Card, Container, Divider, Heading, Section, Text } from '@metamask/snaps-sdk/jsx';
import { numberUtils } from '@hathor/wallet-lib';
import { formatHtrAmount } from '../components';

const renderConditionalCard = (title, value, parsedValue = null) => {
  if (value == null) {
    return null;
  }

  return <Card title={title} value="" description={parsedValue ?? value} />
}

const boolToString = (bool) => {
  return bool ? 'true' : 'false';
}

/**
 * Get the fee model label based on token type
 */
const getFeeModelLabel = (tokenType?: 'deposit' | 'fee'): string => {
  if (tokenType === 'deposit') {
    return 'Deposit Token';
  }
  if (tokenType === 'fee') {
    return 'Fee Token';
  }
  return 'Native Token';
}

export const createTokenPage = async (data, params, origin) => {
  const tokenType = params.token_type as 'deposit' | 'fee' | undefined;
  const amount = BigInt(params.amount);
  const feeModelLabel = getFeeModelLabel(tokenType);

  // Use pre-calculated values from the RPC handler (passed via data)
  const networkFee = data.networkFee;
  const depositAmount = data.depositAmount;

  return await snap.request({
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
            <Section>
              <Card title="Name" value="" description={params.name} />
              <Card title="Symbol" value="" description={params.symbol} />
              <Card title="Fee model" value="" description={feeModelLabel} />
              <Card title="Network fee" value="" description={formatHtrAmount(networkFee)} />
              <Card title="Deposit amount" value="" description={formatHtrAmount(depositAmount)} />
              <Divider />
              <Card title="Amount" value="" description={numberUtils.prettyValue(amount)} />
              {renderConditionalCard('Address', params.address)}
              {renderConditionalCard('Change address', params.change_address)}
              {renderConditionalCard('Create mint authority', params.create_mint, boolToString(params.create_mint))}
              {renderConditionalCard('Mint address', params.mint_authority_address)}
              {renderConditionalCard('Allow external mint address', params.allow_external_mint_authority_address, boolToString(params.allow_external_mint_authority_address))}
              {renderConditionalCard('Create melt authority', params.create_melt, boolToString(params.create_melt))}
              {renderConditionalCard('Melt address', params.melt_authority_address)}
              {renderConditionalCard('Allow external melt address', params.allow_external_melt_authority_address, boolToString(params.allow_external_melt_authority_address))}
              {renderConditionalCard('Data', params.data, params.data ? params.data.join(', ') : '')}
            </Section>
          </Box>
        </Container>
      ),
    },
  });
}
