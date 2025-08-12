import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
import { Bold, Box, Card, Container, Copyable, Divider, Heading, Section, Text } from '@metamask/snaps-sdk/jsx';
import { constants as libConstants, NanoContractActionType, numberUtils } from '@hathor/wallet-lib';

const renderOptionalContractDetail = (param, title) => {
  if (!param) return null;

  return (
    <Box>
      <Card title={title} value="" />
      <Copyable value={param} />
    </Box>
  );
}

const renderArguments = (args) => {
  if (!args || args.length === 0) return null;

  return (
    <Section>
      <Bold>Arguments:</Bold>
      {renderArgsMap(args)}
    </Section>
  );
}

const renderArgsMap = (args) => {
  return args.map((arg) => {
    return <Card title={arg.name} value="" description={arg.parsed.toString()} />
  });
}

const renderActions = (actions) => {
  if (!actions || actions.length === 0) return null;

  return (
    <Section>
      <Bold>Actions:</Bold>
      {renderActionsMap(actions)}
    </Section>
  );
}

const renderActionsMap = (actions) => {
  return actions.map((action) => {
    return renderAction(action)
  });
}

const actionTitleMap = {
  [NanoContractActionType.DEPOSIT]: 'Deposit',
  [NanoContractActionType.WITHDRAWAL]: 'Withdrawal',
  [NanoContractActionType.GRANT_AUTHORITY]: 'Grant Authority',
  [NanoContractActionType.ACQUIRE_AUTHORITY]: 'Acquire Authority',
};

const renderAmount = (action) => {
  if (action.type === NanoContractActionType.DEPOSIT || action.type === NanoContractActionType.WITHDRAWAL) {
    return <Card title="Amount" value={numberUtils.prettyValue(action.amount)} />
  }

  return <Card title="Authority" value={action.authority.upperCase()} />
}

const renderToken = (action) => {
  const token = action.token === libConstants.NATIVE_TOKEN_UID ? libConstants.DEFAULT_NATIVE_TOKEN_CONFIG.symbol : action.token;
  if (action.token === action.token === libConstants.NATIVE_TOKEN_UID) {
    return <Card title="Token" value={libConstants.DEFAULT_NATIVE_TOKEN_CONFIG.symbol} />
  }

  return (
    <Box>
      <Bold>Token</Bold>
      <Copyable value={action.token} />
    </Box>
  );
}

const renderAddresses = (action) => {
  if (action.type === NanoContractActionType.WITHDRAWAL || action.type === NanoContractActionType.ACQUIRE_AUTHORITY) {
    return (
      <Box>
        <Bold>Address to receive</Bold>
        <Copyable value={action.address} />
      </Box>
    );
  }

  if (action.type === NanoContractActionType.DEPOSIT) {
    if (!action.address && !action.changeAddress) return null;

    return (
      <Box>
        {action.address ? (
          <Box>
            <Bold>Address to filter UTXOs</Bold>
            <Copyable value={action.address} />
          </Box>
        ) : null}
        {action.changeAddress ? (
          <Box>
            <Bold>Change address</Bold>
            <Copyable value={action.changeAddress} />
          </Box>
        ) : null}
      </Box>
    );
  }

  if (action.type === NanoContractActionType.GRANT_AUTHORITY) {
    if (!action.address && !action.authorityAddress) return null;

    return (
      <Box>
        {action.address ? (
          <Box>
            <Bold>Address to filter UTXOs</Bold>
            <Copyable value={action.address} />
          </Box>
        ) : null}
        {action.authorityAddress ? (
          <Box>
            <Bold>Authority address</Bold>
            <Copyable value={action.authorityAddress} />
          </Box>
        ) : null}
      </Box>
    );
  }
}

const renderAction = (action) => {
  return (
    <Box>
      <Bold>{actionTitleMap[action.type]}</Bold>
      {renderAmount(action)} 
      {renderToken(action)}
      {renderAddresses(action)}
    </Box>
  );
}

export const createNanoPage = async (data, params, origin) => (
  await snap.request({
    method: REQUEST_METHODS.DIALOG,
    params: {
      type: DIALOG_TYPES.CONFIRMATION,
      content: (
        <Container backgroundColor="alternative">
          <Box>
            <Heading>Send Nano Contract Transaction</Heading>
            <Text>
              The dApp {origin} is requesting permission to execute a nano contract transaction on the Hathor Network
            </Text>
            <Section>
              <Bold>Contract Details:</Bold>
              {renderOptionalContractDetail(params.nc_id, "Nano Contract ID")}
              {renderOptionalContractDetail(params.blueprint_id, "Blueprint ID")}
              <Card title="Blueprint method" value="" description={params.method} />
            </Section>
            {renderArguments(data.parsedArgs)}
            {renderActions(params.actions)}
          </Box>
        </Container>
      ),
    },
  })
)
