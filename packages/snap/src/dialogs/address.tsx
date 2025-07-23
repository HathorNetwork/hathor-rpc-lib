import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
import { Box, Container, Copyable, Heading, Section, Text } from '@metamask/snaps-sdk/jsx';

const renderParamText = (params) => {
  switch (params.type) {
    case 'first_empty':
      return 'First empty address'
    case 'index':
      return `Address at index ${params.index}`
    default:
      return 'Unsupported type'
  }
}

const getAddressIndex = (data, params) => {
  if (params.type === 'index') {
    return params.index.toString();
  }

  if (params.type === 'first_empty') {
    return data.address.index.toString();
  }

  // We currently don't support client and full_path types
  return '';
}

const getAddress = (data, params) => {
  if (params.type === 'index') {
    return data.address;
  }

  if (params.type === 'first_empty') {
    return data.address.address;
  }

  // We currently don't support client and full_path types
  return '';
}

const renderAddressIndex = (data, params) => {
  if (params.type === 'index') {
    // We already show the address index at the params box
    return null;
  }

  return (
    <Text>
      Address at index {getAddressIndex(data, params)}
    </Text>
  );
}

export const addressPage = async (data, params, origin) => (
  await snap.request({
    method: REQUEST_METHODS.DIALOG,
    params: {
      type: DIALOG_TYPES.CONFIRMATION,
      content: (
        <Container backgroundColor='alternative'>
          <Box>
            <Heading>Request address</Heading>
            <Text>
              The dApp {origin} is requesting your public address.
            </Text>
            <Section>
              <Text>{renderParamText(params)}</Text>
            </Section>
            <Text>
              The following address will be shared if the request is confirmed.
            </Text>
            <Section>
              {renderAddressIndex(data, params)}
              <Copyable value={getAddress(data, params)} />
            </Section>
          </Box>
        </Container>
      ),
    },
  })
)