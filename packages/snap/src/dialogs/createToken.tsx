import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
import { Box, Card, Container, Divider, Heading, Section, Text } from '@metamask/snaps-sdk/jsx';
import { numberUtils } from '@hathor/wallet-lib';

const renderConditionalCard = (title, value, parsedValue = null) => {
  if (value == null) {
    return null;
  }

  return <Card title={title} value={parsedValue ?? value} description=" " extra=' ' />
}

const boolToString = (bool) => {
  return bool ? 'true' : 'false';
}

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
            <Section>
              <Card title="Name" value={params.name} />
              <Card title="Symbol" value={params.symbol} />
              <Card title="Amount" value={numberUtils.prettyValue(params.amount)} />
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
  })
)
