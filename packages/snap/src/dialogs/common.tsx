import { REQUEST_METHODS, DIALOG_TYPES } from '../constants';
import { Bold, Box, Card, Container, Copyable, Divider, Heading, Section, Text } from '@metamask/snaps-sdk/jsx';
import { constants as libConstants, bigIntUtils, dateUtils, NanoContractActionType, numberUtils } from '@hathor/wallet-lib';

/*
 * Some render helper methods used to render nano contract data
 * This was moved to a common file because it's used by
 * the send nano tx and send nano create token tx
 */
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
    return <Card title="Amount" value="" description={numberUtils.prettyValue(action.amount)} />
  }

  return <Card title="Authority" value="" description={action.authority.toUpperCase()} />
}

const renderToken = (action) => {
  if (action.token === libConstants.NATIVE_TOKEN_UID) {
    return <Card title="Token" value="" description={libConstants.DEFAULT_NATIVE_TOKEN_CONFIG.symbol} />
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
    <Section>
      <Bold>{actionTitleMap[action.type]}</Bold>
      {renderAmount(action)} 
      {renderToken(action)}
      {renderAddresses(action)}
    </Section>
  );
}

export const renderNanoData = (data) => (
  <Box>
    <Section>
      <Bold>Contract Details:</Bold>
      {renderOptionalContractDetail(data.ncId, "Nano Contract ID")}
      {renderOptionalContractDetail(data.blueprintId, "Blueprint ID")}
      <Card title="Blueprint method" value="" description={data.method} />
    </Section>
    {renderArguments(data.parsedArgs)}
    {renderActions(data.actions)}
  </Box>
);

/*
 * Some render helper methods used to render token creation data
 * This was moved to a common file because it's used by
 * the create token and send nano create token tx
 */
const renderConditionalCard = (title, value, parsedValue = null) => {
  if (value == null) {
    return null;
  }

  return <Card title={title} value="" description={parsedValue ?? value} />
}

const boolToString = (bool) => {
  return bool ? 'true' : 'false';
}

export const renderCreateTokenData = (data) => (
  <Section>
    <Card title="Name" value="" description={data.name} />
    <Card title="Symbol" value="" description={data.symbol} />
    <Card title="Amount" value="" description={numberUtils.prettyValue(data.amount)} />
    {renderConditionalCard('Address', data.address)}
    {renderConditionalCard('Change address', data.change_address)}
    {renderConditionalCard('Create mint authority', data.create_mint, boolToString(data.create_mint))}
    {renderConditionalCard('Mint address', data.mint_authority_address)}
    {renderConditionalCard('Allow external mint address', data.allow_external_mint_authority_address, boolToString(data.allow_external_mint_authority_address))}
    {renderConditionalCard('Create melt authority', data.create_melt, boolToString(data.create_melt))}
    {renderConditionalCard('Melt address', data.melt_authority_address)}
    {renderConditionalCard('Allow external melt address', data.allow_external_melt_authority_address, boolToString(data.allow_external_melt_authority_address))}
    {renderConditionalCard('Contract pays token deposit', data.contract_pays_token_deposit, boolToString(data.contract_pays_token_deposit))}
    {renderConditionalCard('Data', data.data, data.data ? data.data.join(', ') : '')}
  </Section>
);