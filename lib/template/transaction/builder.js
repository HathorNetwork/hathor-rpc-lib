"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TransactionTemplateBuilder = void 0;
var _bigint = require("../../utils/bigint");
var _instructions = require("./instructions");
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// Helper schemas to validate the arguments of each command in the builder args
const RawInputInsArgs = _instructions.RawInputInstruction.omit({
  type: true
});
const UtxoSelectInsArgs = _instructions.UtxoSelectInstruction.omit({
  type: true
});
const AuthoritySelectInsArgs = _instructions.AuthoritySelectInstruction.omit({
  type: true
});
const RawOutputInsArgs = _instructions.RawOutputInstruction.omit({
  type: true
});
const DataOutputInsArgs = _instructions.DataOutputInstruction.omit({
  type: true
});
const TokenOutputInsArgs = _instructions.TokenOutputInstruction.omit({
  type: true
});
const AuthorityOutputInsArgs = _instructions.AuthorityOutputInstruction.omit({
  type: true
});
const ShuffleInsArgs = _instructions.ShuffleInstruction.omit({
  type: true
});
const CompleteTxInsArgs = _instructions.CompleteTxInstruction.omit({
  type: true
});
const ConfigInsArgs = _instructions.ConfigInstruction.omit({
  type: true
});
const SetVarInsArgs = _instructions.SetVarInstruction.omit({
  type: true
});
const NanoMethodInsArgs = _instructions.NanoMethodInstruction.omit({
  type: true
});
class TransactionTemplateBuilder {
  constructor() {
    _defineProperty(this, "template", void 0);
    this.template = [];
  }
  static new() {
    return new TransactionTemplateBuilder();
  }
  static from(instructions) {
    const parsedTemplate = _instructions.TransactionTemplate.parse(instructions);
    const tt = new TransactionTemplateBuilder();
    tt.template = parsedTemplate;
    return tt;
  }
  build() {
    return this.template;
  }
  export(space = 2) {
    return _bigint.JSONBigInt.stringify(this.template, space);
  }
  addInstruction(ins) {
    this.template.push(_instructions.TxTemplateInstruction.parse(ins));
    return this;
  }
  addRawInput(ins) {
    const parsedIns = _instructions.RawInputInstruction.parse({
      type: 'input/raw',
      ...ins
    });
    this.template.push(parsedIns);
    return this;
  }
  addUtxoSelect(ins) {
    const parsedIns = _instructions.UtxoSelectInstruction.parse({
      type: 'input/utxo',
      ...ins
    });
    this.template.push(parsedIns);
    return this;
  }
  addAuthoritySelect(ins) {
    const parsedIns = _instructions.AuthoritySelectInstruction.parse({
      type: 'input/authority',
      ...ins
    });
    this.template.push(parsedIns);
    return this;
  }
  addRawOutput(ins) {
    const parsedIns = _instructions.RawOutputInstruction.parse({
      type: 'output/raw',
      ...ins
    });
    this.template.push(parsedIns);
    return this;
  }
  addDataOutput(ins) {
    const parsedIns = _instructions.DataOutputInstruction.parse({
      type: 'output/data',
      ...ins
    });
    this.template.push(parsedIns);
    return this;
  }
  addTokenOutput(ins) {
    const parsedIns = _instructions.TokenOutputInstruction.parse({
      type: 'output/token',
      ...ins
    });
    this.template.push(parsedIns);
    return this;
  }
  addAuthorityOutput(ins) {
    const parsedIns = _instructions.AuthorityOutputInstruction.parse({
      type: 'output/authority',
      ...ins
    });
    this.template.push(parsedIns);
    return this;
  }
  addShuffleAction(ins) {
    const parsedIns = _instructions.ShuffleInstruction.parse({
      type: 'action/shuffle',
      ...ins
    });
    this.template.push(parsedIns);
    return this;
  }
  addCompleteAction(ins) {
    const parsedIns = _instructions.CompleteTxInstruction.parse({
      type: 'action/complete',
      ...ins
    });
    this.template.push(parsedIns);
    return this;
  }
  addConfigAction(ins) {
    const parsedIns = _instructions.ConfigInstruction.parse({
      type: 'action/config',
      ...ins
    });
    this.template.push(parsedIns);
    return this;
  }
  addSetVarAction(ins) {
    const parsedIns = _instructions.SetVarInstruction.parse({
      type: 'action/setvar',
      ...ins
    });
    this.template.push(parsedIns);
    return this;
  }
  addNanoMethodExecution(ins) {
    const parsedIns = _instructions.NanoMethodInstruction.parse({
      type: 'nano/execute',
      ...ins
    });
    this.template.push(parsedIns);
    return this;
  }
}
exports.TransactionTemplateBuilder = TransactionTemplateBuilder;