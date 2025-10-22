"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.execAuthorityOutputInstruction = execAuthorityOutputInstruction;
exports.execAuthoritySelectInstruction = execAuthoritySelectInstruction;
exports.execCompleteTxInstruction = execCompleteTxInstruction;
exports.execConfigInstruction = execConfigInstruction;
exports.execDataOutputInstruction = execDataOutputInstruction;
exports.execNanoMethodInstruction = execNanoMethodInstruction;
exports.execRawInputInstruction = execRawInputInstruction;
exports.execRawOutputInstruction = execRawOutputInstruction;
exports.execSetVarInstruction = execSetVarInstruction;
exports.execShuffleInstruction = execShuffleInstruction;
exports.execTokenOutputInstruction = execTokenOutputInstruction;
exports.execUtxoSelectInstruction = execUtxoSelectInstruction;
exports.findInstructionExecution = findInstructionExecution;
exports.runInstruction = runInstruction;
var _zod = require("zod");
var _lodash = require("lodash");
var _instructions = require("./instructions");
var _input = _interopRequireDefault(require("../../models/input"));
var _output = _interopRequireDefault(require("../../models/output"));
var _constants = require("../../constants");
var _address = require("../../utils/address");
var _bigint = require("../../utils/bigint");
var _script_data = _interopRequireDefault(require("../../models/script_data"));
var _setvarcommands = require("./setvarcommands");
var _utils = require("./utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Find and run the executor function for the instruction.
 */
async function runInstruction(interpreter, ctx, ins) {
  const instructionExecutor = findInstructionExecution(ins);
  await instructionExecutor(interpreter, ctx, ins);
}

/**
 * Get the executor function for a specific instruction.
 * Since we parse the instruction we can guarantee the validity.
 */
function findInstructionExecution(ins) {
  /* eslint-enable @typescript-eslint/no-explicit-any */
  switch (_instructions.TxTemplateInstruction.parse(ins).type) {
    case 'input/raw':
      return execRawInputInstruction;
    case 'input/utxo':
      return execUtxoSelectInstruction;
    case 'input/authority':
      return execAuthoritySelectInstruction;
    case 'output/raw':
      return execRawOutputInstruction;
    case 'output/data':
      return execDataOutputInstruction;
    case 'output/token':
      return execTokenOutputInstruction;
    case 'output/authority':
      return execAuthorityOutputInstruction;
    case 'action/shuffle':
      return execShuffleInstruction;
    case 'action/complete':
      return execCompleteTxInstruction;
    case 'action/config':
      return execConfigInstruction;
    case 'action/setvar':
      return execSetVarInstruction;
    case 'nano/execute':
      return execNanoMethodInstruction;
    default:
      throw new Error('Cannot determine the instruction to run');
  }
}

/**
 * Execution for RawInputInstruction
 */
async function execRawInputInstruction(interpreter, ctx, ins) {
  ctx.log(`Begin RawInputInstruction: ${_bigint.JSONBigInt.stringify(ins)}`);
  const {
    position
  } = ins;
  const txId = (0, _instructions.getVariable)(ins.txId, ctx.vars, _instructions.RawInputInstruction.shape.txId);
  const index = (0, _instructions.getVariable)(ins.index, ctx.vars, _instructions.RawInputInstruction.shape.index);
  ctx.log(`index(${index}), txId(${txId})`);

  // Find the original transaction from the input
  const origTx = await interpreter.getTx(txId);
  // Add balance to the ctx.balance
  ctx.balance.addBalanceFromUtxo(origTx, index);
  const input = new _input.default(txId, index);
  ctx.addInputs(position, input);
}

/**
 * Execution for UtxoSelectInstruction
 */
async function execUtxoSelectInstruction(interpreter, ctx, ins) {
  ctx.log(`Begin UtxoSelectInstruction: ${_bigint.JSONBigInt.stringify(ins)}`);
  const {
    position
  } = ins;
  const fill = (0, _instructions.getVariable)(ins.fill, ctx.vars, _instructions.UtxoSelectInstruction.shape.fill);
  const token = (0, _instructions.getVariable)(ins.token, ctx.vars, _instructions.UtxoSelectInstruction.shape.token);
  const address = (0, _instructions.getVariable)(ins.address, ctx.vars, _instructions.UtxoSelectInstruction.shape.address);
  ctx.log(`fill(${fill}), address(${address}), token(${token})`);
  const {
    autoChange
  } = ins;

  // Find utxos
  const options = {
    token
  };
  if (address) {
    options.filter_address = address;
  }
  const changeAddress = (0, _instructions.getVariable)(ins.changeAddress, ctx.vars, _instructions.UtxoSelectInstruction.shape.changeAddress) ?? (await interpreter.getChangeAddress(ctx));
  await (0, _utils.selectTokens)(interpreter, ctx, fill, options, autoChange, changeAddress, position);
}

/**
 * Execution for AuthoritySelectInstruction
 */
async function execAuthoritySelectInstruction(interpreter, ctx, ins) {
  ctx.log(`Begin AuthoritySelectInstruction: ${_bigint.JSONBigInt.stringify(ins)}`);
  const position = ins.position ?? -1;
  const {
    authority
  } = ins;
  const token = (0, _instructions.getVariable)(ins.token, ctx.vars, _instructions.AuthoritySelectInstruction.shape.token);
  const count = (0, _instructions.getVariable)(ins.count, ctx.vars, _instructions.AuthoritySelectInstruction.shape.count);
  const address = (0, _instructions.getVariable)(ins.address, ctx.vars, _instructions.AuthoritySelectInstruction.shape.address);
  ctx.log(`count(${count}), address(${address}), token(${token})`);
  let authoritiesInt = 0n;
  if (authority === 'mint') {
    authoritiesInt += _constants.TOKEN_MINT_MASK;
  }
  if (authority === 'melt') {
    authoritiesInt += _constants.TOKEN_MELT_MASK;
  }

  // Find utxos
  const options = {
    token,
    authorities: authoritiesInt
  };
  if (address) {
    options.filter_address = address;
  }
  await (0, _utils.selectAuthorities)(interpreter, ctx, options, count, position);
}

/**
 * Execution for RawOutputInstruction
 */
async function execRawOutputInstruction(_interpreter, ctx, ins) {
  ctx.log(`Begin RawOutputInstruction: ${_bigint.JSONBigInt.stringify(ins)}`);
  const {
    position,
    authority,
    useCreatedToken
  } = ins;
  const scriptStr = (0, _instructions.getVariable)(ins.script, ctx.vars, _instructions.RawOutputInstruction.shape.script);
  const script = Buffer.from(scriptStr, 'hex');
  const token = (0, _instructions.getVariable)(ins.token, ctx.vars, _instructions.RawOutputInstruction.shape.token);
  const timelock = (0, _instructions.getVariable)(ins.timelock, ctx.vars, _instructions.RawOutputInstruction.shape.timelock);
  let amount = (0, _instructions.getVariable)(ins.amount, ctx.vars, _instructions.RawOutputInstruction.shape.amount);
  ctx.log(`amount(${amount}) timelock(${timelock}) script(${script}) token(${token})`);
  if (!(authority || amount)) {
    throw new Error('Raw token output missing amount');
  }

  // get tokenData and update token balance on the context
  let tokenData;
  if (useCreatedToken) {
    if (!ctx.isCreateTokenTxContext()) {
      ctx.log(`Current transaction is not creating a token.`);
      throw new Error('Current transaction is not creating a token.');
    }
    tokenData = 1;
    if (authority) {
      ctx.log(`Creating authority output`);
      ctx.balance.addCreatedTokenOutputAuthority(1, authority);
    } else {
      ctx.log(`Creating token output`);
      if (amount) {
        ctx.balance.addCreatedTokenOutput(amount);
      }
    }
  } else {
    // Add token to tokens array
    tokenData = ctx.addToken(token);
    if (authority) {
      ctx.log(`Creating authority output`);
      ctx.balance.addOutputAuthority(1, token, authority);
    } else {
      ctx.log(`Creating token output`);
      if (amount) {
        ctx.balance.addOutput(amount, token);
      }
    }
  }
  switch (authority) {
    case 'mint':
      amount = _constants.TOKEN_MINT_MASK;
      tokenData |= _constants.TOKEN_AUTHORITY_MASK;
      break;
    case 'melt':
      amount = _constants.TOKEN_MELT_MASK;
      tokenData |= _constants.TOKEN_AUTHORITY_MASK;
      break;
    default:
      break;
  }
  if (!amount) {
    throw new Error('Raw token output missing amount');
  }
  const output = new _output.default(amount, script, {
    timelock,
    tokenData
  });
  ctx.addOutputs(position, output);
}

/**
 * Execution for DataOutputInstruction
 */
async function execDataOutputInstruction(_interpreter, ctx, ins) {
  ctx.log(`Begin DataOutputInstruction: ${_bigint.JSONBigInt.stringify(ins)}`);
  const {
    position,
    useCreatedToken
  } = ins;
  const data = (0, _instructions.getVariable)(ins.data, ctx.vars, _instructions.DataOutputInstruction.shape.data);
  const token = (0, _instructions.getVariable)(ins.token, ctx.vars, _instructions.DataOutputInstruction.shape.token);
  ctx.log(`Creating data(${data}) output for token(${token})`);
  let tokenData;
  if (useCreatedToken) {
    if (!ctx.isCreateTokenTxContext()) {
      ctx.log(`Current transaction is not creating a token.`);
      throw new Error('Current transaction is not creating a token.');
    }
    ctx.log(`Using created token`);
    tokenData = 1;
    ctx.balance.addCreatedTokenOutput(1n);
  } else {
    ctx.log(`Using token(${token})`);
    // Add token to tokens array
    tokenData = ctx.addToken(token);
    ctx.balance.addOutput(1n, token);
  }
  const dataScript = new _script_data.default(data);
  const script = dataScript.createScript();
  const output = new _output.default(1n, script, {
    tokenData
  });
  ctx.addOutputs(position, output);
}

/**
 * Execution for TokenOutputInstruction
 */
async function execTokenOutputInstruction(interpreter, ctx, ins) {
  ctx.log(`Begin TokenOutputInstruction: ${_bigint.JSONBigInt.stringify(ins)}`);
  const {
    position,
    useCreatedToken
  } = ins;
  const token = (0, _instructions.getVariable)(ins.token, ctx.vars, _instructions.TokenOutputInstruction.shape.token);
  const address = (0, _instructions.getVariable)(ins.address, ctx.vars, _instructions.TokenOutputInstruction.shape.address);
  const timelock = (0, _instructions.getVariable)(ins.timelock, ctx.vars, _instructions.TokenOutputInstruction.shape.timelock);
  const amount = (0, _instructions.getVariable)(ins.amount, ctx.vars, _instructions.TokenOutputInstruction.shape.amount);
  ctx.log(`Creating token output with amount(${amount}) address(${address}) timelock(${timelock})`);
  let tokenData;
  if (useCreatedToken) {
    if (!ctx.isCreateTokenTxContext()) {
      ctx.log(`Current transaction is not creating a token.`);
      throw new Error('Current transaction is not creating a token.');
    }
    ctx.log(`Using created token`);
    tokenData = 1;
    ctx.balance.addCreatedTokenOutput(amount);
  } else {
    ctx.log(`Using token(${token})`);
    // Add token to tokens array
    tokenData = ctx.addToken(token);
    ctx.balance.addOutput(amount, token);
  }
  const script = (0, _address.createOutputScriptFromAddress)(address, interpreter.getNetwork());
  const output = new _output.default(amount, script, {
    timelock,
    tokenData
  });
  ctx.addOutputs(position, output);
}

/**
 * Execution for AuthorityOutputInstruction
 */
async function execAuthorityOutputInstruction(interpreter, ctx, ins) {
  ctx.log(`Begin AuthorityOutputInstruction: ${_bigint.JSONBigInt.stringify(ins)}`);
  const {
    authority,
    position,
    useCreatedToken
  } = ins;
  const token = (0, _instructions.getVariable)(ins.token, ctx.vars, _instructions.AuthorityOutputInstruction.shape.token);
  const address = (0, _instructions.getVariable)(ins.address, ctx.vars, _instructions.AuthorityOutputInstruction.shape.address);
  const timelock = (0, _instructions.getVariable)(ins.timelock, ctx.vars, _instructions.AuthorityOutputInstruction.shape.timelock);
  const count = (0, _instructions.getVariable)(ins.count, ctx.vars, _instructions.AuthorityOutputInstruction.shape.count);
  ctx.log(`Creating count(${count}) "${authority}" authority outputs with address(${address}) timelock(${timelock})`);
  let tokenData;
  if (useCreatedToken) {
    if (!ctx.isCreateTokenTxContext()) {
      ctx.log(`Current transaction is not creating a token.`);
      throw new Error('Current transaction is not creating a token.');
    }
    ctx.log(`Using created token`);
    tokenData = 1;
    ctx.balance.addCreatedTokenOutputAuthority(count, authority);
  } else {
    if (!token) {
      throw new Error(`token is required when trying to add an authority output`);
    }
    ctx.log(`Using token(${token})`);
    // Add token to tokens array
    tokenData = ctx.addToken(token);
    // Add balance to the ctx.balance
    ctx.balance.addOutputAuthority(count, token, authority);
  }
  let amount = 0n;
  switch (authority) {
    case 'mint':
      amount = _constants.TOKEN_MINT_MASK;
      tokenData |= _constants.TOKEN_AUTHORITY_MASK;
      break;
    case 'melt':
      amount = _constants.TOKEN_MELT_MASK;
      tokenData |= _constants.TOKEN_AUTHORITY_MASK;
      break;
    default:
      throw new Error('Authority token output missing `authority`');
  }
  const script = (0, _address.createOutputScriptFromAddress)(address, interpreter.getNetwork());
  const output = new _output.default(amount, script, {
    timelock,
    tokenData
  });
  // Creates `count` outputs that are copies of the `output`
  ctx.addOutputs(position, ...Array(count).fill(output));
}

/**
 * Execution for ShuffleInstruction
 */
async function execShuffleInstruction(_interpreter, ctx, ins) {
  ctx.log(`Begin ShuffleInstruction: ${_bigint.JSONBigInt.stringify(ins)}`);
  const {
    target
  } = ins;

  // The token array should never be shuffled since outputs have a "pointer" to the token position
  // on the token array, so shuffling would make the outputs target different outputs.

  if (target === 'inputs' || target === 'all') {
    ctx.inputs = (0, _lodash.shuffle)(ctx.inputs);
  }
  if (target === 'outputs' || target === 'all') {
    ctx.outputs = (0, _lodash.shuffle)(ctx.outputs);
  }
}

/**
 * Execution for CompleteTxInstruction
 */
async function execCompleteTxInstruction(interpreter, ctx, ins) {
  ctx.log(`Begin CompleteTxInstruction: ${_bigint.JSONBigInt.stringify(ins)}`);
  const token = (0, _instructions.getVariable)(ins.token, ctx.vars, _instructions.CompleteTxInstruction.shape.token);
  const changeAddress = (0, _instructions.getVariable)(ins.changeAddress, ctx.vars, _instructions.CompleteTxInstruction.shape.changeAddress) ?? (await interpreter.getChangeAddress(ctx));
  const address = (0, _instructions.getVariable)(ins.address, ctx.vars, _instructions.CompleteTxInstruction.shape.address);
  const timelock = (0, _instructions.getVariable)(ins.timelock, ctx.vars, _instructions.CompleteTxInstruction.shape.timelock);
  const {
    skipSelection,
    skipAuthorities,
    skipChange,
    calculateFee
  } = ins;
  ctx.log(`changeAddress(${changeAddress}) address(${address}) timelock(${timelock}) token(${token}), calculateFee(${calculateFee}), skipSelection(${skipSelection}), skipChange(${skipChange}), skipAuthorities(${skipAuthorities})`);
  const tokensToCheck = [];
  if (token) {
    tokensToCheck.push(token);
  } else {
    // Check HTR and all tokens on the transaction
    tokensToCheck.push(_constants.NATIVE_TOKEN_UID);
    ctx.tokens.forEach(tk => {
      tokensToCheck.push(tk);
    });
  }

  // calculate token creation fee
  if (calculateFee && ctx.isCreateTokenTxContext()) {
    // INFO: Currently fees only make sense for create token transactions.

    const amount = ctx.balance.createdTokenBalance.tokens;
    const deposit = interpreter.getHTRDeposit(amount);

    // Add the required HTR to create the tokens
    const balance = ctx.balance.getTokenBalance(_constants.NATIVE_TOKEN_UID);
    balance.tokens += deposit;
    ctx.balance.setTokenBalance(_constants.NATIVE_TOKEN_UID, balance);

    // If we weren't going to check HTR, we need to include in the tokens to check
    if (!tokensToCheck.includes(_constants.NATIVE_TOKEN_UID)) {
      tokensToCheck.push(_constants.NATIVE_TOKEN_UID);
    }
  }
  const changeScript = (0, _address.createOutputScriptFromAddress)(changeAddress, interpreter.getNetwork());
  for (const tokenUid of tokensToCheck) {
    ctx.log(`Completing tx for token ${tokenUid}`);
    // Check balances for token.
    const balance = ctx.balance.getTokenBalance(tokenUid);
    const tokenData = ctx.addToken(tokenUid);
    if (balance.tokens > 0 && !skipChange) {
      const value = balance.tokens;
      // Surplus of token on the inputs, need to add a change output
      ctx.log(`Creating a change output for ${value} / ${tokenUid}`);
      // Add balance to the ctx.balance
      ctx.balance.addOutput(value, tokenUid);

      // Creates an output with the value of the outstanding balance
      const output = new _output.default(value, changeScript, {
        timelock,
        tokenData
      });
      ctx.addOutputs(-1, output);
    } else if (balance.tokens < 0 && !skipSelection) {
      const value = -balance.tokens;
      ctx.log(`Finding inputs for ${value} / ${tokenUid}`);
      // Surplus of tokens on the outputs, need to select tokens and add inputs
      const options = {
        token: tokenUid
      };
      if (address) {
        options.filter_address = address;
      }
      const {
        changeAmount,
        utxos
      } = await interpreter.getUtxos(value, options);

      // Add utxos as inputs on the transaction
      const inputs = [];
      for (const utxo of utxos) {
        ctx.log(`Found utxo with ${utxo.value} of ${utxo.tokenId}`);
        ctx.log(`Create input ${utxo.index} / ${utxo.txId}`);
        inputs.push(new _input.default(utxo.txId, utxo.index));
        // Update balance
        const origTx = await interpreter.getTx(utxo.txId);
        ctx.balance.addBalanceFromUtxo(origTx, utxo.index);
      }

      // Then add inputs to context
      ctx.addInputs(-1, ...inputs);
      if (changeAmount) {
        ctx.log(`Creating change with ${changeAmount} for address: ${changeAddress}`);
        const output = new _output.default(changeAmount, changeScript, {
          tokenData
        });
        ctx.balance.addOutput(changeAmount, tokenUid);
        ctx.addOutputs(-1, output);
      }
    }

    // Skip authority blocks if we wish to not include authority completion.
    if (skipAuthorities) {
      continue;
    }
    if (balance.mint_authorities > 0) {
      const count = balance.mint_authorities;
      ctx.log(`Creating ${count} mint outputs / ${tokenUid}`);
      // Need to create a token output
      // Add balance to the ctx.balance
      ctx.balance.addOutputAuthority(count, tokenUid, 'mint');

      // Creates an output with the value of the outstanding balance
      const output = new _output.default(_constants.TOKEN_MINT_MASK, changeScript, {
        timelock,
        tokenData: tokenData | _constants.TOKEN_AUTHORITY_MASK
      });
      ctx.addOutputs(-1, ...Array(count).fill(output));
    } else if (balance.mint_authorities < 0) {
      const count = -balance.mint_authorities;
      ctx.log(`Finding inputs for ${count} mint authorities / ${tokenUid}`);
      // Need to find authorities to fill balance
      const utxos = await interpreter.getAuthorities(count, {
        token: tokenUid,
        authorities: 1n // Mint
      });

      // Add utxos as inputs on the transaction
      const inputs = [];
      for (const utxo of utxos) {
        ctx.log(`Found authority utxo ${utxo.authorities} of ${token}`);
        ctx.log(`Create input ${utxo.index} / ${utxo.txId}`);
        inputs.push(new _input.default(utxo.txId, utxo.index));
      }
      // First, update balance
      for (const input of inputs) {
        const origTx = await interpreter.getTx(input.hash);
        ctx.balance.addBalanceFromUtxo(origTx, input.index);
      }

      // Then add inputs to context
      ctx.addInputs(-1, ...inputs);
    }
    if (balance.melt_authorities > 0) {
      const count = balance.melt_authorities;
      ctx.log(`Creating ${count} melt outputs / ${tokenUid}`);
      // Need to create a token output
      // Add balance to the ctx.balance
      ctx.balance.addOutputAuthority(count, tokenUid, 'melt');

      // Creates an output with the value of the outstanding balance
      const output = new _output.default(_constants.TOKEN_MELT_MASK, changeScript, {
        timelock,
        tokenData: tokenData | _constants.TOKEN_AUTHORITY_MASK
      });
      ctx.addOutputs(-1, ...Array(count).fill(output));
    } else if (balance.melt_authorities < 0) {
      const count = -balance.melt_authorities;
      ctx.log(`Finding inputs for ${count} melt authorities / ${tokenUid}`);
      // Need to find authorities to fill balance
      const utxos = await interpreter.getAuthorities(count, {
        token: tokenUid,
        authorities: 2n // Melt
      });

      // Add utxos as inputs on the transaction
      const inputs = [];
      for (const utxo of utxos) {
        ctx.log(`Found authority utxo ${utxo.authorities} of ${token}`);
        ctx.log(`Create input ${utxo.index} / ${utxo.txId}`);
        inputs.push(new _input.default(utxo.txId, utxo.index));
      }
      // First, update balance
      for (const input of inputs) {
        const origTx = await interpreter.getTx(input.hash);
        ctx.balance.addBalanceFromUtxo(origTx, input.index);
      }

      // Then add inputs to context
      ctx.addInputs(-1, ...inputs);
    }
  }
}

/**
 * Execution for ConfigInstruction
 */
async function execConfigInstruction(_interpreter, ctx, ins) {
  ctx.log(`Begin ConfigInstruction: ${_bigint.JSONBigInt.stringify(ins)}`);
  const version = (0, _instructions.getVariable)(ins.version, ctx.vars, _instructions.ConfigInstruction.shape.version);
  const signalBits = (0, _instructions.getVariable)(ins.signalBits, ctx.vars, _instructions.ConfigInstruction.shape.signalBits);
  const tokenName = (0, _instructions.getVariable)(ins.tokenName, ctx.vars, _instructions.ConfigInstruction.shape.tokenName);
  const tokenSymbol = (0, _instructions.getVariable)(ins.tokenSymbol, ctx.vars, _instructions.ConfigInstruction.shape.tokenSymbol);
  const createToken = (0, _instructions.getVariable)(ins.createToken, ctx.vars, _instructions.ConfigInstruction.shape.createToken);
  ctx.log(`version(${version}) signalBits(${signalBits}) tokenName(${tokenName}) tokenSymbol(${tokenSymbol}) createToken(${createToken})`);
  if (version) {
    ctx.version = version;
  }
  if (signalBits) {
    ctx.signalBits = signalBits;
  }
  if (tokenName) {
    ctx.tokenName = tokenName;
  }
  if (tokenSymbol) {
    ctx.tokenSymbol = tokenSymbol;
  }
  if (createToken) {
    ctx.useCreateTokenTxContext();
  }
}

/**
 * Execution for SetVarInstruction
 */
async function execSetVarInstruction(interpreter, ctx, ins) {
  ctx.log(`Begin SetVarInstruction: ${_bigint.JSONBigInt.stringify(ins)}`);
  if (!ins.call) {
    ctx.log(`Setting ${ins.name} with ${ins.value}`);
    ctx.vars[ins.name] = ins.value;
    return;
  }
  if (ins.call.method === 'get_wallet_address') {
    // Validate options and get token variable
    const callArgs = _instructions.SetVarGetWalletAddressOpts.parse(ins.call);
    // Call action with valid options
    const address = await (0, _setvarcommands.getWalletAddress)(interpreter, ctx, callArgs);
    ctx.log(`Setting ${ins.name} with ${address}`);
    ctx.vars[ins.name] = address;
    return;
  }
  if (ins.call.method === 'get_wallet_balance') {
    // Validate options and get token variable
    const callArgs = _instructions.SetVarGetWalletBalanceOpts.parse(ins.call);
    const token = (0, _instructions.getVariable)(callArgs.token, ctx.vars, _instructions.SetVarGetWalletBalanceOpts.shape.token);
    const newOptions = (0, _lodash.clone)(callArgs);
    newOptions.token = token;
    // Call action with valid options
    const balance = await (0, _setvarcommands.getWalletBalance)(interpreter, ctx, newOptions);
    ctx.vars[ins.name] = balance;
    ctx.log(`Setting ${ins.name} with ${balance}`);
    return;
  }
  if (ins.call.method === 'get_oracle_script') {
    const callArgs = _instructions.SetVarGetOracleScriptOpts.parse(ins.call);
    const oracle = await (0, _setvarcommands.getOracleScript)(interpreter, ctx, callArgs);
    ctx.log(`Setting ${ins.name} with ${oracle}`);
    ctx.vars[ins.name] = oracle;
    return;
  }
  if (ins.call.method === 'get_oracle_signed_data') {
    const callArgs = _instructions.SetVarGetOracleSignedDataOpts.parse(ins.call);
    const signedData = await (0, _setvarcommands.getOracleSignedData)(interpreter, ctx, callArgs);
    ctx.log(`Setting ${ins.name} with ${signedData}`);
    ctx.vars[ins.name] = signedData;
    return;
  }
  throw new Error('Invalid setvar command');
}

/**
 * Validate NanoContract Deposit action
 */
async function validateDepositNanoAction(interpreter, ctx, action) {
  const token = (0, _instructions.getVariable)(action.token, ctx.vars, _instructions.NanoDepositAction.shape.token);
  ctx.addToken(token);
  const amount = (0, _instructions.getVariable)(action.amount, ctx.vars, _instructions.NanoDepositAction.shape.amount);
  const address = (0, _instructions.getVariable)(action.address, ctx.vars, _instructions.NanoDepositAction.shape.address);

  // This is the action without variables, which will be used to create the header
  // Change address may be a reference but since its not used on the header it makes no difference.
  const actual = {
    ...action,
    token,
    amount,
    address
  };
  if (action.skipSelection || action.useCreatedToken) {
    // Do not select inputs
    return actual;
  }

  // Find utxos
  const options = {
    token
  };
  if (address) {
    options.filter_address = address;
  }
  const changeAddress = (0, _instructions.getVariable)(action.changeAddress, ctx.vars, _instructions.NanoDepositAction.shape.changeAddress) ?? (await interpreter.getChangeAddress(ctx));
  await (0, _utils.selectTokens)(interpreter, ctx, amount, options, action.autoChange, changeAddress);
  return actual;
}

/**
 * Validate NanoContract Withdrawal action
 */
async function validateWithdrawalNanoAction(interpreter, ctx, action) {
  const token = (0, _instructions.getVariable)(action.token, ctx.vars, _instructions.NanoWithdrawalAction.shape.token);
  ctx.addToken(token);
  const amount = (0, _instructions.getVariable)(action.amount, ctx.vars, _instructions.NanoWithdrawalAction.shape.amount);
  const address = (0, _instructions.getVariable)(action.address, ctx.vars, _instructions.NanoWithdrawalAction.shape.address) ?? (await interpreter.getAddress());

  // This is the action without variables, which will be used to create the header
  const actual = {
    ...action,
    token,
    amount,
    address
  };
  if (!action.skipOutputs) {
    const tokenData = ctx.addToken(token);
    const script = (0, _address.createOutputScriptFromAddress)(address, interpreter.getNetwork());
    const output = new _output.default(amount, script, {
      tokenData
    });
    ctx.addOutputs(-1, output);
  }
  return actual;
}

/**
 * Validate NanoContract Grant Authority action
 */
async function validateGrantAuthorityNanoAction(interpreter, ctx, action) {
  const token = (0, _instructions.getVariable)(action.token, ctx.vars, _instructions.NanoGrantAuthorityAction.shape.token);
  ctx.addToken(token);
  const {
    authority
  } = action;
  const address = (0, _instructions.getVariable)(action.address, ctx.vars, _instructions.NanoGrantAuthorityAction.shape.address);

  // This is the action without variables, which will be used to create the header
  const actual = {
    ...action,
    token,
    authority,
    address
  };
  if (action.skipSelection || action.useCreatedToken) {
    // Do not select inputs
    return actual;
  }
  let authoritiesInt = 0n;
  if (authority === 'mint') {
    authoritiesInt += _constants.TOKEN_MINT_MASK;
  }
  if (authority === 'melt') {
    authoritiesInt += _constants.TOKEN_MELT_MASK;
  }

  // Find utxos
  const options = {
    token,
    authorities: authoritiesInt
  };
  if (address) {
    options.filter_address = address;
  }
  await (0, _utils.selectAuthorities)(interpreter, ctx, options);
  return actual;
}

/**
 * Validate NanoContract Acquire Authority action
 */
async function validateAcquireAuthorityNanoAction(interpreter, ctx, action) {
  const token = (0, _instructions.getVariable)(action.token, ctx.vars, _instructions.NanoAcquireAuthorityAction.shape.token);
  ctx.addToken(token);
  const address = (0, _instructions.getVariable)(action.address, ctx.vars, _instructions.NanoAcquireAuthorityAction.shape.address) ?? (await interpreter.getAddress());

  // This is the action without variables, which will be used to create the header
  const actual = {
    ...action,
    token,
    authority: action.authority,
    address
  };
  if (!action.skipOutputs) {
    const tokenData = _constants.TOKEN_AUTHORITY_MASK | ctx.addToken(token);
    let amount;
    if (action.authority === 'mint') {
      amount = _constants.TOKEN_MINT_MASK;
    } else if (action.authority === 'melt') {
      amount = _constants.TOKEN_MELT_MASK;
    } else {
      throw new Error('This should never happen');
    }
    const script = (0, _address.createOutputScriptFromAddress)(address, interpreter.getNetwork());
    const output = new _output.default(amount, script, {
      tokenData
    });
    ctx.addOutputs(-1, output);
  }
  return actual;
}

/**
 * Execution for NanoMethodInstruction
 */
async function execNanoMethodInstruction(_interpreter, ctx, ins) {
  ctx.log(`Begin NanoMethodInstruction: ${_bigint.JSONBigInt.stringify(ins)}`);
  const id = (0, _instructions.getVariable)(ins.id, ctx.vars, _instructions.NanoMethodInstruction.shape.id);
  const {
    method
  } = ins;
  const caller = (0, _instructions.getVariable)(ins.caller, ctx.vars, _instructions.NanoMethodInstruction.shape.caller);
  const args = [];
  for (const arg of ins.args) {
    const parsedArg = (0, _instructions.getVariable)(arg, ctx.vars, _zod.z.string().or(_zod.z.unknown()));
    args.push(parsedArg);
  }
  ctx.log(`id(${id}) method(${method}) caller(${caller}) args(${args})`);
  const actions = [];
  for (const action of ins.actions || []) {
    switch (action.action) {
      case 'deposit':
        actions.push(await validateDepositNanoAction(_interpreter, ctx, action));
        break;
      case 'withdrawal':
        actions.push(await validateWithdrawalNanoAction(_interpreter, ctx, action));
        break;
      case 'grant_authority':
        actions.push(await validateGrantAuthorityNanoAction(_interpreter, ctx, action));
        break;
      case 'acquire_authority':
        actions.push(await validateAcquireAuthorityNanoAction(_interpreter, ctx, action));
        break;
      default:
        ctx.log(`Called nano method execute with action ${JSON.stringify(action)}`);
        throw new Error('This should never happen');
    }
  }
  ctx.startNanoContractExecution(id, method, caller, args, actions);
}