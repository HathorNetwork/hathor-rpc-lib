"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "MemoryStore", {
  enumerable: true,
  get: function () {
    return _memory_store.MemoryStore;
  }
});
Object.defineProperty(exports, "Storage", {
  enumerable: true,
  get: function () {
    return _storage.Storage;
  }
});
exports.default = void 0;
var _storage = require("./storage");
var _memory_store = require("./memory_store");
/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const store = new _memory_store.MemoryStore();
const storage = new _storage.Storage(store);
var _default = exports.default = storage;