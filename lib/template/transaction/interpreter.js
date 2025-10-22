"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WalletTxTemplateInterpreter = void 0;
var _zod = require("zod");
var _instructions = require("./instructions");
var _executor = require("./executor");
var _context = require("./context");
var _transaction = _interopRequireDefault(require("../../models/transaction"));
var _address = _interopRequireDefault(require("../../models/address"));
var _constants = require("../../constants");
var _transaction2 = _interopRequireDefault(require("../../utils/transaction"));
var _leb = _interopRequireDefault(require("../../utils/leb128"));
var _tokens = _interopRequireDefault(require("../../utils/tokens"));
var _create_token_transaction = _interopRequireDefault(require("../../models/create_token_transaction"));
var _header = _interopRequireDefault(require("../../nano_contracts/header"));
var _types = require("../../nano_contracts/types");
var _utils = require("../../nano_contracts/utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _asyncIterator(r) { var n, t, o, e = 2; for ("undefined" != typeof Symbol && (t = Symbol.asyncIterator, o = Symbol.iterator); e--;) { if (t && null != (n = r[t])) return n.call(r); if (o && null != (n = r[o])) return new AsyncFromSyncIterator(n.call(r)); t = "@@asyncIterator", o = "@@iterator"; } throw new TypeError("Object is not async iterable"); }
function AsyncFromSyncIterator(r) { function AsyncFromSyncIteratorContinuation(r) { if (Object(r) !== r) return Promise.reject(new TypeError(r + " is not an object.")); var n = r.done; return Promise.resolve(r.value).then(function (r) { return { value: r, done: n }; }); } return AsyncFromSyncIterator = function (r) { this.s = r, this.n = r.next; }, AsyncFromSyncIterator.prototype = { s: null, n: null, next: function () { return AsyncFromSyncIteratorContinuation(this.n.apply(this.s, arguments)); }, return: function (r) { var n = this.s.return; return void 0 === n ? Promise.resolve({ value: r, done: !0 }) : AsyncFromSyncIteratorContinuation(n.apply(this.s, arguments)); }, throw: function (r) { var n = this.s.return; return void 0 === n ? Promise.reject(r) : AsyncFromSyncIteratorContinuation(n.apply(this.s, arguments)); } }, new AsyncFromSyncIterator(r); } /**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
class WalletTxTemplateInterpreter {
  constructor(wallet) {
    _defineProperty(this, "wallet", void 0);
    _defineProperty(this, "txCache", void 0);
    this.wallet = wallet;
    this.txCache = {};
  }
  async getBlueprintId(nanoCtx) {
    if (nanoCtx.method === _constants.NANO_CONTRACTS_INITIALIZE_METHOD) {
      return nanoCtx.id;
    }
    let response;
    try {
      response = await this.wallet.getFullTxById(nanoCtx.id);
    } catch (ex) {
      throw new Error(`Error getting nano contract transaction with id ${nanoCtx.id}.`);
    }
    if (!response.tx.nc_id) {
      throw new Error(`Transaction ${nanoCtx.id} is not a nano contract.`);
    }
    return response.tx.nc_blueprint_id;
  }
  static mapActionInstructionToAction(ctx, action) {
    const tokens = ctx.tokens.map(t => ({
      uid: t,
      name: '',
      symbol: ''
    }));
    const {
      token
    } = action;
    let amount = 0n;

    // Prepare amount
    if (action.action === 'deposit' || action.action === 'withdrawal') {
      // This parse is because action.amount may be a template reference name.
      // The actual amount is discovered when running the instructions and inputed on the action.
      // So this should be a bigint, but if it is not (for any reason) we would throw an error.
      amount = _zod.z.bigint().parse(action.amount);
    }
    if (action.action === 'grant_authority' || action.action === 'acquire_authority') {
      if (action.authority === 'mint') {
        amount += _constants.TOKEN_MINT_MASK;
      }
      if (action.authority === 'melt') {
        amount += _constants.TOKEN_MELT_MASK;
      }
    }
    if (amount === 0n) {
      throw new Error('Action amount cannot be zero');
    }
    let tokenIndex = 0;
    // Prepare tokenIndex
    if (action.action === 'deposit' || action.action === 'grant_authority') {
      tokenIndex = action.useCreatedToken ? 1 : _tokens.default.getTokenIndex(tokens, token);
    }
    if (action.action === 'withdrawal' || action.action === 'acquire_authority') {
      tokenIndex = _tokens.default.getTokenIndex(tokens, token);
    }
    return {
      type: _types.ActionTypeToActionHeaderType[action.action],
      amount,
      tokenIndex
    };
  }
  async buildNanoHeader(ctx) {
    const nanoCtx = ctx.nanoContext;
    if (!nanoCtx) {
      throw new Error('Cannot build the header without the nano context data');
    }
    const blueprintId = await this.getBlueprintId(nanoCtx);
    const network = this.getNetwork();
    const address = new _address.default(nanoCtx.caller, {
      network
    });
    try {
      address.validateAddress();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not validate caller address';
      throw new Error(message);
    }
    const args = await (0, _utils.validateAndParseBlueprintMethodArgs)(blueprintId, nanoCtx.method, nanoCtx.args, network);
    const arr = [_leb.default.encodeUnsigned(args.length)];
    args.forEach(arg => {
      arr.push(arg.field.toBuffer());
    });
    const serializedArgs = Buffer.concat(arr);
    const seqnum = await this.wallet.getNanoHeaderSeqnum(address);
    const nanoHeaderActions = nanoCtx.actions.map(action => WalletTxTemplateInterpreter.mapActionInstructionToAction(ctx, action));
    return new _header.default(nanoCtx.id, nanoCtx.method, serializedArgs, nanoHeaderActions, seqnum, address, null);
  }
  async build(instructions, debug = false) {
    const context = new _context.TxTemplateContext(this.wallet.logger, debug);
    for (const ins of _instructions.TransactionTemplate.parse(instructions)) {
      await (0, _executor.runInstruction)(this, context, ins);
    }
    const headers = [];
    if (context.nanoContext) {
      const nanoHeader = await this.buildNanoHeader(context);
      headers.push(nanoHeader);
    }
    if (context.version === _constants.DEFAULT_TX_VERSION) {
      return new _transaction.default(context.inputs, context.outputs, {
        signalBits: context.signalBits,
        version: context.version,
        tokens: context.tokens,
        headers
      });
    }
    if (context.version === _constants.CREATE_TOKEN_TX_VERSION) {
      if (!context.tokenName || !context.tokenSymbol) {
        throw new Error('Cannot create a token without a name or symbol');
      }
      return new _create_token_transaction.default(context.tokenName, context.tokenSymbol, context.inputs, context.outputs, {
        signalBits: context.signalBits,
        headers
      });
    }
    throw new Error('Unsupported Version byte provided');
  }
  async buildAndSign(instructions, pinCode, debug = false) {
    let tx = await this.build(instructions, debug);
    tx = await _transaction2.default.signTransaction(tx, this.wallet.storage, pinCode);
    tx.prepareToSend();
    return tx;
  }
  async getAddress(markAsUsed = false) {
    const addr = await this.wallet.getCurrentAddress({
      markAsUsed
    });
    return addr.address;
  }
  async getAddressAtIndex(index) {
    return this.wallet.getAddressAtIndex(index);
  }
  async getBalance(token) {
    const balance = await this.wallet.getBalance(token);
    return balance[0];
  }

  /**
   * XXX: maybe we can save the change address chosen on the context.
   * This way the same change address would be used throughout the transaction
   */
  async getChangeAddress(_ctx) {
    const addr = await this.wallet.getCurrentAddress();
    return addr.address;
  }
  async getUtxos(amount, options) {
    // XXX: This may throw, but maybe we should let it.
    return this.wallet.getUtxosForAmount(amount, options);
  }
  async getAuthorities(count, options) {
    const newOptions = {
      ...options,
      max_utxos: count
    };
    const utxos = [];
    // XXX: This may throw, but maybe we should let it.
    var _iteratorAbruptCompletion = false;
    var _didIteratorError = false;
    var _iteratorError;
    try {
      for (var _iterator = _asyncIterator(this.wallet.storage.selectUtxos(newOptions)), _step; _iteratorAbruptCompletion = !(_step = await _iterator.next()).done; _iteratorAbruptCompletion = false) {
        const utxo = _step.value;
        {
          utxos.push(utxo);
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (_iteratorAbruptCompletion && _iterator.return != null) {
          await _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
    return utxos;
  }
  async getTx(txId) {
    if (this.txCache[txId]) {
      return this.txCache[txId];
    }
    const histtx = await this.wallet.getTx(txId);
    if (histtx) {
      this.txCache[txId] = histtx;
      return this.txCache[txId];
    }
    const resp = await this.wallet.getFullTxById(txId);
    // We can assume the wallet handles any network errors
    const normalizedTx = _transaction2.default.convertFullNodeTxToHistoryTx(resp);
    this.txCache[txId] = normalizedTx;
    return this.txCache[txId];
  }
  getNetwork() {
    return this.wallet.getNetworkObject();
  }
  getWallet() {
    return this.wallet;
  }
  getHTRDeposit(mintAmount) {
    return _tokens.default.getMintDeposit(mintAmount, this.wallet.storage);
  }
}
exports.WalletTxTemplateInterpreter = WalletTxTemplateInterpreter;