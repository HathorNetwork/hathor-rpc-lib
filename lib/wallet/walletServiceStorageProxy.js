"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WalletServiceStorageProxy = void 0;
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _awaitAsyncGenerator(e) { return new _OverloadYield(e, 0); }
function _wrapAsyncGenerator(e) { return function () { return new AsyncGenerator(e.apply(this, arguments)); }; }
function AsyncGenerator(e) { var r, t; function resume(r, t) { try { var n = e[r](t), o = n.value, u = o instanceof _OverloadYield; Promise.resolve(u ? o.v : o).then(function (t) { if (u) { var i = "return" === r ? "return" : "next"; if (!o.k || t.done) return resume(i, t); t = e[i](t).value; } settle(n.done ? "return" : "normal", t); }, function (e) { resume("throw", e); }); } catch (e) { settle("throw", e); } } function settle(e, n) { switch (e) { case "return": r.resolve({ value: n, done: !0 }); break; case "throw": r.reject(n); break; default: r.resolve({ value: n, done: !1 }); } (r = r.next) ? resume(r.key, r.arg) : t = null; } this._invoke = function (e, n) { return new Promise(function (o, u) { var i = { key: e, arg: n, resolve: o, reject: u, next: null }; t ? t = t.next = i : (r = t = i, resume(e, n)); }); }, "function" != typeof e.return && (this.return = void 0); }
AsyncGenerator.prototype["function" == typeof Symbol && Symbol.asyncIterator || "@@asyncIterator"] = function () { return this; }, AsyncGenerator.prototype.next = function (e) { return this._invoke("next", e); }, AsyncGenerator.prototype.throw = function (e) { return this._invoke("throw", e); }, AsyncGenerator.prototype.return = function (e) { return this._invoke("return", e); };
function _OverloadYield(e, d) { this.v = e, this.k = d; } /**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/**
 * Storage proxy that implements missing storage methods for wallet service
 * by delegating to wallet service API calls.
 *
 * This proxy enables nano contract transaction signing by providing:
 * - getAddressInfo: Maps addresses to BIP32 indices
 * - getTx: Fetches transaction data from full node API
 * - getTxSignatures: Delegates to transaction signing utilities
 */
class WalletServiceStorageProxy {
  constructor(wallet, originalStorage) {
    _defineProperty(this, "wallet", void 0);
    _defineProperty(this, "originalStorage", void 0);
    this.wallet = wallet;
    this.originalStorage = originalStorage;
  }

  /**
   * Creates a proxy that wraps the original storage with additional methods
   * needed for nano contract transaction signing.
   */
  createProxy() {
    return new Proxy(this.originalStorage, {
      get: this.proxyHandler.bind(this)
    });
  }
  proxyHandler(target, prop, receiver) {
    if (prop === 'getAddressInfo') {
      return this.getAddressInfo.bind(this);
    }
    if (prop === 'getTxSignatures') {
      return this.getTxSignatures.bind(this, receiver);
    }
    if (prop === 'getTx') {
      return this.getTx.bind(this);
    }
    if (prop === 'getSpentTxs') {
      return this.getSpentTxs.bind(this);
    }
    if (prop === 'getCurrentAddress') {
      return this.getCurrentAddress.bind(this);
    }

    // For all other properties, use the original behavior
    const value = Reflect.get(target, prop, receiver);

    // Bind methods to maintain correct 'this' context
    if (typeof value === 'function') {
      return value.bind(target);
    }
    return value;
  }

  /**
   * Get address information including BIP32 index
   * First tries local wallet cache, then falls back to API
   */
  async getAddressInfo(address) {
    const addressIndex = this.wallet.getAddressIndex(address);
    if (addressIndex !== undefined) {
      return {
        bip32AddressIndex: addressIndex
      };
    }

    // Address not in local cache, try API
    try {
      const addressDetails = await this.wallet.getAddressDetails(address);
      return {
        bip32AddressIndex: addressDetails.index
      };
    } catch (error) {
      return null; // Address doesn't belong to this wallet
    }
  }

  /**
   * Get transaction signatures using the transaction utility
   */
  // eslint-disable-next-line class-methods-use-this
  async getTxSignatures(receiver, tx, pinCode) {
    const transaction = await Promise.resolve().then(() => _interopRequireWildcard(require('../utils/transaction')));
    const result = await transaction.default.getSignatureForTx(tx, receiver, pinCode);
    return result;
  }

  /**
   * Get spent transactions for input signing
   * This is an async generator that yields transaction data for each input
   */
  getSpentTxs(inputs) {
    var _this = this;
    return _wrapAsyncGenerator(function* () {
      for (let index = 0; index < inputs.length; index++) {
        const input = inputs[index];
        const tx = yield _awaitAsyncGenerator(_this.getTx(input.hash));
        if (tx) {
          yield {
            tx,
            input,
            index
          };
        }
      }
    })();
  }

  /**
   * Get transaction data by fetching from full node and converting format
   */
  async getTx(txId) {
    try {
      const fullTxResponse = await this.wallet.getFullTxById(txId);
      const result = this.convertFullNodeToHistoryTx(fullTxResponse);
      return result;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current address from wallet service
   * Uses the wallet's getCurrentAddress method which fetches from the API
   */
  async getCurrentAddress(markAsUsed) {
    try {
      const currentAddress = await this.wallet.getCurrentAddress({
        markAsUsed
      });
      return currentAddress.address; // Return just the address string for utils compatibility
    } catch (error) {
      throw new Error('Current address is not loaded');
    }
  }

  /**
   * Convert FullNodeTxResponse to IHistoryTx format
   * This bridges the gap between full node API format and wallet storage format
   */
  // eslint-disable-next-line class-methods-use-this
  convertFullNodeToHistoryTx(fullTxResponse) {
    const {
      tx,
      meta
    } = fullTxResponse;
    return {
      tx_id: tx.hash,
      signalBits: 0,
      // Default value since fullnode tx doesn't include signal bits
      version: tx.version,
      weight: tx.weight,
      timestamp: tx.timestamp,
      is_voided: meta.voided_by.length > 0,
      nonce: Number.parseInt(tx.nonce ?? '0', 10),
      inputs: tx.inputs.map(input => ({
        ...input,
        decoded: {
          ...input.decoded,
          type: input.decoded.type ?? undefined
        }
      })),
      outputs: tx.outputs.map(output => ({
        ...output,
        decoded: {
          ...output.decoded,
          type: output.decoded.type ?? undefined
        }
      })),
      parents: tx.parents,
      tokens: tx.tokens.map(token => token.uid),
      height: meta.height,
      first_block: meta.first_block,
      token_name: tx.token_name ?? undefined,
      token_symbol: tx.token_symbol ?? undefined
    };
  }
}
exports.WalletServiceStorageProxy = WalletServiceStorageProxy;