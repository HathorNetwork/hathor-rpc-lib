/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
import { Bold, Box, Card, Container, Copyable, Heading, Icon, Section, Text, Tooltip } from '@metamask/snaps-sdk/jsx';
import { constants as libConstants, bigIntUtils, dateUtils, NanoContractActionType, numberUtils } from '@hathor/wallet-lib';

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
    let parsed;

    if (arg.type === 'Timestamp') {
      parsed = dateUtils.parseTimestamp(arg.parsed);
    } else if (arg.type === 'Amount') {
      parsed = numberUtils.prettyValue(arg.parsed);
    } else {
      parsed = bigIntUtils.JSONBigInt.stringify(arg.parsed);
    }

    return <Card title={arg.name} value="" description={parsed} />
  });
}

const renderActions = (actions, tokenDetails) => {
  if (!actions || actions.length === 0) return null;

  return (
    <Section>
      <Bold>Actions:</Bold>
      {renderActionsMap(actions, tokenDetails)}
    </Section>
  );
}

const renderActionsMap = (actions, tokenDetails) => {
  return actions.map((action) => {
    return renderAction(action, tokenDetails)
  });
}

const actionTitleMap = {
  [NanoContractActionType.DEPOSIT]: 'Deposit',
  [NanoContractActionType.WITHDRAWAL]: 'Withdrawal',
  [NanoContractActionType.GRANT_AUTHORITY]: 'Grant Authority',
  [NanoContractActionType.ACQUIRE_AUTHORITY]: 'Acquire Authority',
};

const renderAmountAndToken = (action, tokenDetails) => {
  const token = action.token;
  const isAmountAction = action.type === NanoContractActionType.DEPOSIT || action.type === NanoContractActionType.WITHDRAWAL;
  const value = isAmountAction ? numberUtils.prettyValue(action.amount) : action.authority.toUpperCase();

  if (!token || token === libConstants.NATIVE_TOKEN_UID) {
    return <Text>{`${value} ${libConstants.DEFAULT_NATIVE_TOKEN_CONFIG.symbol}`}</Text>;
  }

  if (!tokenDetails || !tokenDetails.has(token)) {
    return <Text>{`${value} ${token}`}</Text>;
  }

  const tokenInfo = tokenDetails.get(token);

  return (
    <Tooltip
      content={
        <Text>
          <Bold>{tokenInfo.tokenInfo.name}</Bold>
          {' '}({token})
        </Text>
      }
    >
      <Text>
        {`${value} ${tokenInfo.tokenInfo.symbol} `}
        <Icon name="info" />
      </Text>
    </Tooltip>
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

const renderAction = (action, tokenDetails) => {
  return (
    <Section>
      <Bold>{actionTitleMap[action.type]}</Bold>
      {renderAmountAndToken(action, tokenDetails)}
      {renderAddresses(action)}
    </Section>
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
            {renderActions(params.actions, data.tokenDetails)}
          </Box>
        </Container>
      ),
    },
  })
)
