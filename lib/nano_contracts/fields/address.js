"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AddressSchema = exports.AddressField = void 0;
var _zod = require("zod");
var _base = require("./base");
var _address = _interopRequireDefault(require("../../models/address"));
var _helpers = _interopRequireDefault(require("../../utils/helpers"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ /* eslint class-methods-use-this: ["error", { "exceptMethods": ["getType"] }] */
const AddressSchema = exports.AddressSchema = _zod.z.string().regex(/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{34,35}$/);
class AddressField extends _base.NCFieldBase {
  constructor(network, value = null) {
    super();
    _defineProperty(this, "value", void 0);
    _defineProperty(this, "network", void 0);
    this.value = value;
    this.network = network;
  }
  getType() {
    return 'Address';
  }

  /**
   * Create an instance of AddressField, may be empty to allow reading from other sources.
   * @example
   * ```ts
   * const testnet = new Network('testnet');
   * const buf = Buffer.from('4969ffb1549f2e00f30bfc0cf0b9207ed96f7f33ba578d4852', 'hex');
   *
   * const field = AddressField.new(testnet);
   * const parseData = field.fromBuffer(buf);
   * const fieldFromUser = AddressField.new(testnet).fromUser('WYLW8ujPemSuLJwbeNvvH6y7nakaJ6cEwT');
   * ```
   */
  static new(network) {
    return new AddressField(network, null);
  }
  createNew() {
    return AddressField.new(this.network);
  }
  fromBuffer(buf) {
    if (buf.length < 25) {
      throw new Error('Not enough bytes to read address');
    }
    // First we get the 20 bytes (hash) of the address without the version byte and checksum
    const hashBytes = buf.subarray(1, 21);
    const address = _helpers.default.encodeAddress(hashBytes, this.network);
    address.validateAddress();
    const decoded = address.decode();
    // We need to check that the metadata of the address received match the one we generated
    // Check network version
    if (decoded[0] !== buf[0]) {
      throw new Error(`Asked to deserialize an address with version byte ${buf[0]} but the network from the deserializer object has version byte ${decoded[0]}.`);
    }
    // Check checksum bytes
    const calcChecksum = decoded.subarray(21, 25);
    const recvChecksum = buf.subarray(21, 25);
    if (!calcChecksum.equals(recvChecksum)) {
      // Checksum value generated does not match value from fullnode
      throw new Error(`When parsing and Address(${address.base58}) we calculated checksum(${calcChecksum.toString('hex')}) but it does not match the checksum it came with ${recvChecksum.toString('hex')}.`);
    }
    this.value = address;
    return {
      value: address,
      bytesRead: 25
    };
  }
  toBuffer() {
    if (this.value === null) {
      throw new Error('No value to encode');
    }
    this.value.validateAddress();
    // Address has fixed 25 byte serialization, so no need to add length
    return this.value.decode();
  }
  fromUser(data) {
    // Value is a valid base58 string
    const value = AddressSchema.parse(data);
    const address = new _address.default(value, {
      network: this.network
    });
    address.validateAddress();
    this.value = address;
    return this;
  }
  toUser() {
    if (this.value === null) {
      throw new Error('No value to encode');
    }
    this.value.validateAddress();
    return this.value.base58;
  }
}
exports.AddressField = AddressField;