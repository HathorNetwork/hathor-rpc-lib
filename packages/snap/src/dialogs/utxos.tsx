/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
import { constants as libConstants, numberUtils } from '@hathor/wallet-lib';
import { Bold, Box, Container, Divider, Heading, Section, Text } from '@metamask/snaps-sdk/jsx';

const renderTokenFilterParam = (token) => {
  if (!token || token === libConstants.NATIVE_TOKEN_UID) {
    return libConstants.DEFAULT_NATIVE_TOKEN_CONFIG.symbol;
  }

  return token;
}

// We show the symbol only if it's HTR in the list
const renderTokenSymbol = (token) => {
  if (!token || token === libConstants.NATIVE_TOKEN_UID) {
    return libConstants.DEFAULT_NATIVE_TOKEN_CONFIG.symbol;
  }

  return '';
}

const renderAmountSummary = (data, params) => {
  if (params.authorities) {
    let authority = '';
    if (params.authorities === Number(libConstants.TOKEN_MINT_MASK)) {
      authority = 'mint';
    } else if (params.authorities === Number(libConstants.TOKEN_MELT_MASK)) {
      authority = 'melt';
    }

    return (
      <Text>{`Authority: ${authority}`}</Text>
    );
  }

  return (
    <Text>{`Amount: ${numberUtils.prettyValue(data.total_amount_available)} ${renderTokenSymbol(params.token)}`}</Text>
  );
}

export const renderUtxosContent = (params) => (
  <Section>
    <Text><Bold>Filter parameters</Bold></Text>
    <Divider />
    <Text>Token: {renderTokenFilterParam(params.token)}</Text>
    {params.filterAddress ? <Text>{`Address: ${params.filterAddress}`}</Text> : null}
    {params.maxUtxos ? <Text>{`Maximum quantity: ${params.maxUtxos}`}</Text> : null}
    {params.authorities ? <Text>{`Authority: ${params.authorities}`}</Text> : null}
    {params.amountSmallerThan ? <Text>{`Amount smaller than: ${numberUtils.prettyValue(params.amountSmallerThan)}`}</Text> : null}
    {params.amountBiggerThan ? <Text>{`Amount bigger than: ${numberUtils.prettyValue(params.amountBiggerThan)}`}</Text> : null}
    {params.maximumAmount ? <Text>{`Maximum total amount: ${numberUtils.prettyValue(params.maximumAmount)}`}</Text> : null}
  </Section>
);

export const utxosPage = async (data, params, origin) => {
  const content = (
    <Container backgroundColor='alternative'>
      <Box>
        <Heading>UTXO Details</Heading>
        <Text>
          {`${origin} requests information about ${data.utxos?.length || 0} UTXOs`}
        </Text>

        {renderUtxosContent(params)}

        <Section>
          <Text><Bold>Summary</Bold></Text>
          <Divider />
          <Text>{`Total: ${data.total_utxos_available.toString()} UTXOs`}</Text>
          {renderAmountSummary(data, params)}
        </Section>

        {data.utxos && data.utxos.length > 0 ? (
          <Section>
            <Text><Bold>All UTXOs</Bold></Text>
            <Divider />
            {data.utxos.map((utxo, index) => (
              <Box key={`utxo-${index}`}>
                {params.authorities ? null : <Text>{`${numberUtils.prettyValue(utxo.amount)} ${renderTokenSymbol(params.token)}`}</Text>}
                <Text>{utxo.address}</Text>
                {index < data.utxos.length - 1 ? <Divider /> : null}
              </Box>
            ))}
          </Section>
        ) : (
          <Section>
            <Text>No UTXOs found</Text>
          </Section>
        )}
      </Box>
    </Container>
  );

  return await snap.request({
    method: REQUEST_METHODS.DIALOG,
    params: {
      type: DIALOG_TYPES.CONFIRMATION,
      content,
    },
  });
};