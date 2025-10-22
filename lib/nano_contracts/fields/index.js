"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "NCFieldBase", {
  enumerable: true,
  get: function () {
    return _base.NCFieldBase;
  }
});
exports.default = void 0;
exports.isSignedDataField = isSignedDataField;
var _str = require("./str");
var _int = require("./int");
var _bytes = require("./bytes");
var _bytes2 = require("./bytes32");
var _bool = require("./bool");
var _address = require("./address");
var _timestamp = require("./timestamp");
var _amount = require("./amount");
var _token = require("./token");
var _optional = require("./optional");
var _tuple = require("./tuple");
var _signedData = require("./signedData");
var _dict = require("./dict");
var _collection = require("./collection");
var _base = require("./base");
/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function isSignedDataField(value) {
  return value.getType() === 'SignedData';
}
var _default = exports.default = {
  StrField: _str.StrField,
  IntField: _int.IntField,
  BoolField: _bool.BoolField,
  AddressField: _address.AddressField,
  TimestampField: _timestamp.TimestampField,
  AmountField: _amount.AmountField,
  TokenUidField: _token.TokenUidField,
  // Bytes fields
  BytesField: _bytes.BytesField,
  TxOutputScriptField: _bytes.BytesField,
  // sized bytes (32)
  VertexIdField: _bytes2.Bytes32Field,
  ContractIdField: _bytes2.Bytes32Field,
  BlueprintIdField: _bytes2.Bytes32Field,
  OptionalField: _optional.OptionalField,
  TupleField: _tuple.TupleField,
  SignedDataField: _signedData.SignedDataField,
  RawSignedDataField: _signedData.SignedDataField,
  DictField: _dict.DictField,
  ListField: _collection.CollectionField,
  SetField: _collection.CollectionField,
  DequeField: _collection.CollectionField,
  FrozenSetField: _collection.CollectionField
};