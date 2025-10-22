"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _buffer = require("../utils/buffer");
var _helpers = _interopRequireDefault(require("../utils/helpers"));
var _leb = _interopRequireDefault(require("../utils/leb128"));
var _types = require("../headers/types");
var _base = _interopRequireDefault(require("../headers/base"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
class NanoContractHeader extends _base.default {
  constructor(id, method, args, actions, seqnum, address, script = null) {
    super();
    // It's the blueprint id when this header is calling a initialize method
    // and it's the nano contract id when it's executing another method of a nano
    _defineProperty(this, "id", void 0);
    // Name of the method to be called. When creating a new Nano Contract, it must be equal to 'initialize'
    _defineProperty(this, "method", void 0);
    // Serialized arguments to the method being called
    _defineProperty(this, "args", void 0);
    // List of actions for this nano
    _defineProperty(this, "actions", void 0);
    // Address of the transaction owner(s)/caller(s)
    _defineProperty(this, "address", void 0);
    // Sequential number for the nano header
    _defineProperty(this, "seqnum", void 0);
    /**
     * script with signature(s) of the transaction owner(s)/caller(s).
     * Supports P2PKH and P2SH
     */
    _defineProperty(this, "script", void 0);
    this.id = id;
    this.method = method;
    this.args = args;
    this.actions = actions;
    this.address = address;
    this.script = script;
    this.seqnum = seqnum;
  }

  /**
   * Serialize funds fields
   * Add the serialized fields to the array parameter
   *
   * @param array Array of buffer to push the serialized fields
   * @param addScript If should add the script with the signature(s) when serializing it
   *
   * @memberof NanoContract
   * @inner
   */
  serializeFields(array, addScript) {
    // nano contract id
    array.push((0, _buffer.hexToBuffer)(this.id));

    // Seqnum
    array.push(_leb.default.encodeUnsigned(this.seqnum));
    const methodBytes = Buffer.from(this.method, 'ascii');
    array.push((0, _buffer.intToBytes)(methodBytes.length, 1));
    array.push(methodBytes);
    array.push((0, _buffer.intToBytes)(this.args.length, 2));
    array.push(this.args);
    array.push((0, _buffer.intToBytes)(this.actions.length, 1));
    for (const action of this.actions) {
      const arrAction = [];
      arrAction.push((0, _buffer.intToBytes)(action.type, 1));
      arrAction.push((0, _buffer.intToBytes)(action.tokenIndex, 1));
      arrAction.push((0, _buffer.outputValueToBytes)(action.amount));
      array.push(Buffer.concat(arrAction));
    }
    if (!this.address) {
      throw new Error('Header caller address was not provided');
    }
    const addressBytes = this.address.decode();
    array.push(addressBytes);
    if (addScript && this.script !== null) {
      array.push(_leb.default.encodeUnsigned(this.script.length, 2));
      array.push(this.script);
    } else {
      // Script with length 0 indicates there is no script.
      array.push(_leb.default.encodeUnsigned(0, 2));
    }
  }

  /**
   * Serialize sighash data to bytes
   *
   * @memberof NanoContractHeader
   * @inner
   */
  serializeSighash(array) {
    this.serializeFields(array, false);
  }

  /**
   * Serialize header to bytes
   *
   * @memberof NanoContractHeader
   * @inner
   */
  serialize(array) {
    // First add the header ID
    array.push((0, _types.getVertexHeaderIdBuffer)(_types.VertexHeaderId.NANO_HEADER));

    // Then the serialized header
    this.serializeFields(array, true);
  }

  /**
   * Deserialize buffer to Header object and
   * return the rest of the buffer data
   *
   * @return Header object deserialized and the rest of buffer data
   *
   * @memberof NanoContractHeader
   * @inner
   */
  static deserialize(srcBuf, network) {
    // Copies buffer locally, not to change the original parameter
    let buf = Buffer.from(srcBuf);
    if ((0, _types.getVertexHeaderIdFromBuffer)(buf) !== _types.VertexHeaderId.NANO_HEADER) {
      throw new Error('Invalid vertex header id for nano header.');
    }
    buf = buf.subarray(1);
    let ncId;
    let method;
    let args;
    const actions = [];
    let address;

    /* eslint-disable prefer-const -- To split these declarations would be confusing.
     * In all of them the first parameter should be a const and the second a let. */

    // NC ID is 32 bytes in hex
    let ncIdBuffer;
    [ncIdBuffer, buf] = (0, _buffer.unpackLen)(32, buf);
    ncId = ncIdBuffer.toString('hex');

    // Seqnum has variable length with maximum of 8 bytes
    let seqnum;
    ({
      value: seqnum,
      rest: buf
    } = _leb.default.decodeUnsigned(buf, 8));

    // nc method
    let methodLen;
    let methodBuffer;
    [methodLen, buf] = (0, _buffer.unpackToInt)(1, false, buf);
    [methodBuffer, buf] = (0, _buffer.unpackLen)(methodLen, buf);
    method = methodBuffer.toString('ascii');

    // nc args
    let argsLen;
    [argsLen, buf] = (0, _buffer.unpackToInt)(2, false, buf);
    [args, buf] = (0, _buffer.unpackLen)(argsLen, buf);

    // nc actions
    let actionsLen;
    [actionsLen, buf] = (0, _buffer.unpackToInt)(1, false, buf);
    for (let i = 0; i < actionsLen; i++) {
      let actionTypeBytes;
      let actionType;
      let tokenIndex;
      let amount;
      [actionTypeBytes, buf] = [buf.subarray(0, 1), buf.subarray(1)];
      [actionType] = (0, _buffer.unpackToInt)(1, false, actionTypeBytes);
      [tokenIndex, buf] = (0, _buffer.unpackToInt)(1, false, buf);
      [amount, buf] = (0, _buffer.bytesToOutputValue)(buf);
      actions.push({
        type: actionType,
        tokenIndex,
        amount
      });
    }

    // nc address
    let addressBytes;
    [addressBytes, buf] = (0, _buffer.unpackLen)(25, buf);
    address = _helpers.default.getAddressFromBytes(addressBytes, network);

    // nc script
    let scriptLen;
    ({
      value: scriptLen,
      rest: buf
    } = _leb.default.decodeUnsigned(buf, 2));
    const header = new NanoContractHeader(ncId, method, args, actions, Number(seqnum), address);
    if (scriptLen !== 0n) {
      // script might be null
      [header.script, buf] = (0, _buffer.unpackLen)(Number(scriptLen), buf);
    }
    /* eslint-enable prefer-const */

    return [header, buf];
  }

  /**
   * Get the nano contract header from the list of headers.
   *
   * @return The nano header object
   *
   * @memberof Transaction
   * @inner
   */
  static getHeadersFromTx(tx) {
    const headers = [];
    for (const header of tx.headers) {
      if (header instanceof NanoContractHeader) {
        headers.push(header);
      }
    }
    return headers;
  }
}
var _default = exports.default = NanoContractHeader;