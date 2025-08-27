import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
import { Bold, Box, Container, Heading, Text } from '@metamask/snaps-sdk/jsx';
import { renderCreateTokenData, renderNanoData } from './common';

export const createNanoAndTokenPage = async (data, params, origin) => (
  await snap.request({
    method: REQUEST_METHODS.DIALOG,
    params: {
      type: DIALOG_TYPES.CONFIRMATION,
      content: (
        <Container backgroundColor="alternative">
          <Box>
            <Heading>Send Nano Contract Transaction with Token Creation</Heading>
            <Text>
              The dApp {origin} is requesting permission to execute a nano contract transaction and create a token on the Hathor Network
            </Text>
            {renderNanoData(data.nano)}
            <Text><Bold>Token creation details:</Bold></Text>
            {renderCreateTokenData(params.createTokenOptions)}
          </Box>
        </Container>
      ),
    },
  })
)