"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TxTemplateContext = exports.TxBalance = exports.NanoContractContext = void 0;
var _types = require("../../types");
var _transaction = _interopRequireDefault(require("../../utils/transaction"));
var _constants = require("../../constants");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ /* eslint max-classes-per-file: ["error", 3] */
class TxBalance {
  constructor() {
    _defineProperty(this, "balance", void 0);
    _defineProperty(this, "createdTokenBalance", void 0);
    this.balance = {};
    this.createdTokenBalance = null;
  }

  /**
   * Get the current balance of the given token.
   */
  getTokenBalance(token) {
    if (!this.balance[token]) {
      this.balance[token] = {
        tokens: 0n,
        mint_authorities: 0,
        melt_authorities: 0
      };
    }
    return this.balance[token];
  }

  /**
   * Get the current balance of the token being created.
   * Obs: only valid for create token transactions.
   */
  getCreatedTokenBalance() {
    if (!this.createdTokenBalance) {
      this.createdTokenBalance = {
        tokens: 0n,
        mint_authorities: 0,
        melt_authorities: 0
      };
    }
    return this.createdTokenBalance;
  }

  /**
   * Set the balance of a token.
   */
  setTokenBalance(token, balance) {
    this.balance[token] = balance;
  }

  /**
   * Set the balance of the created token.
   */
  setCreatedTokenBalance(balance) {
    this.createdTokenBalance = balance;
  }

  /**
   * Add balance from utxo of the given transaction.
   */
  addBalanceFromUtxo(tx, index) {
    if (tx.outputs.length <= index) {
      throw new Error('Index does not exist on tx outputs');
    }
    const output = tx.outputs[index];
    const {
      token
    } = output;
    const balance = this.getTokenBalance(token);
    if (_transaction.default.isAuthorityOutput(output)) {
      if (_transaction.default.isMint(output)) {
        balance.mint_authorities += 1;
      }
      if (_transaction.default.isMelt(output)) {
        balance.melt_authorities += 1;
      }
    } else {
      balance.tokens += output.value;
    }
    this.setTokenBalance(token, balance);
  }

  /**
   * Remove the balance given from the token balance.
   */
  addOutput(amount, token) {
    const balance = this.getTokenBalance(token);
    balance.tokens -= amount;
    this.setTokenBalance(token, balance);
  }

  /**
   * Remove the balance from the token being created.
   */
  addCreatedTokenOutput(amount) {
    const balance = this.getCreatedTokenBalance();
    balance.tokens -= amount;
    this.setCreatedTokenBalance(balance);
  }

  /**
   * Remove the specified authority from the balance of the given token.
   */
  addOutputAuthority(count, token, authority) {
    const balance = this.getTokenBalance(token);
    if (authority === 'mint') {
      balance.mint_authorities -= count;
    }
    if (authority === 'melt') {
      balance.melt_authorities -= count;
    }
    this.setTokenBalance(token, balance);
  }

  /**
   * Remove the authority from the balance of the token being created.
   */
  addCreatedTokenOutputAuthority(count, authority) {
    const balance = this.getCreatedTokenBalance();
    if (authority === 'mint') {
      balance.mint_authorities -= count;
    }
    if (authority === 'melt') {
      balance.melt_authorities -= count;
    }
    this.setCreatedTokenBalance(balance);
  }
}
exports.TxBalance = TxBalance;
class NanoContractContext {
  constructor(id, method, caller, args, actions) {
    _defineProperty(this, "id", void 0);
    _defineProperty(this, "method", void 0);
    _defineProperty(this, "caller", void 0);
    _defineProperty(this, "args", void 0);
    _defineProperty(this, "actions", void 0);
    this.id = id;
    this.method = method;
    this.caller = caller;
    this.args = args;
    this.actions = actions;
  }
}
exports.NanoContractContext = NanoContractContext;
class TxTemplateContext {
  constructor(logger, debug = false) {
    _defineProperty(this, "version", void 0);
    _defineProperty(this, "signalBits", void 0);
    _defineProperty(this, "inputs", void 0);
    _defineProperty(this, "outputs", void 0);
    _defineProperty(this, "tokens", void 0);
    _defineProperty(this, "balance", void 0);
    _defineProperty(this, "tokenName", void 0);
    _defineProperty(this, "tokenSymbol", void 0);
    _defineProperty(this, "nanoContext", void 0);
    _defineProperty(this, "vars", void 0);
    _defineProperty(this, "_logs", void 0);
    _defineProperty(this, "_logger", void 0);
    _defineProperty(this, "debug", void 0);
    this.inputs = [];
    this.outputs = [];
    this.tokens = [];
    this.version = _constants.DEFAULT_TX_VERSION;
    this.signalBits = 0;
    this.balance = new TxBalance();
    this.vars = {};
    this._logs = [];
    this._logger = logger ?? (0, _types.getDefaultLogger)();
    this.debug = debug;
  }

  /**
   * Add the line to the log array.
   * Optionally use the logger to show the logs as they are being created.
   */
  log(message) {
    this._logs.push(message);
    if (this.debug) {
      this._logger.info(message);
    }
  }
  get logArray() {
    return this._logs;
  }

  /**
   * Change the current tx
   */
  useCreateTokenTxContext() {
    if (this.tokens.length !== 0) {
      throw new Error(`Trying to build a create token tx with ${this.tokens.length} tokens on the array`);
    }
    this.version = _constants.CREATE_TOKEN_TX_VERSION;
  }
  isCreateTokenTxContext() {
    return this.version === _constants.CREATE_TOKEN_TX_VERSION;
  }
  startNanoContractExecution(id, method, caller, args, actions) {
    if (this.nanoContext) {
      throw new Error('Already building a nano contract tx.');
    }
    this.nanoContext = new NanoContractContext(id, method, caller, args, actions);
  }
  isNanoMethodExecution() {
    return !!this.nanoContext;
  }

  /**
   * Add a token to the transaction and return its token_data.
   * The token array order will be preserved so the token_data is final.
   *
   * If the transaction is a CREATE_TOKEN_TX it does not have a token array,
   * only HTR (token_data=0) and the created token(token_data=1)
   *
   * @param token Token UID.
   * @returns token_data for the requested token.
   */
  addToken(token) {
    if (token === _constants.NATIVE_TOKEN_UID) {
      return 0;
    }
    if (this.version === _constants.CREATE_TOKEN_TX_VERSION) {
      throw new Error(`Cannot add a custom token to a CREATE_TOKEN_TX`);
    }
    const index = this.tokens.indexOf(token);
    if (index > -1) {
      // Token is already on the list.
      return index + 1;
    }
    // Token is not on the list, adding now
    this.tokens.push(token);
    return this.tokens.length;
  }

  /**
   * Add inputs to the context.
   */
  addInputs(position, ...inputs) {
    if (position === -1) {
      this.inputs.push(...inputs);
      return;
    }
    this.inputs.splice(position, 0, ...inputs);
  }

  /**
   * Add outputs to the context.
   */
  addOutputs(position, ...outputs) {
    if (position === -1) {
      this.outputs.push(...outputs);
      return;
    }
    this.outputs.splice(position, 0, ...outputs);
  }
}
exports.TxTemplateContext = TxTemplateContext;