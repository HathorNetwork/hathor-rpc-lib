"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.utf8 = exports.sizedBytes = exports.leb128 = exports.bytes = exports.bool = void 0;
var _bytes = _interopRequireWildcard(require("./bytes"));
exports.bytes = _bytes;
var _utf = _interopRequireWildcard(require("./utf8"));
exports.utf8 = _utf;
var _sizedBytes = _interopRequireWildcard(require("./sizedBytes"));
exports.sizedBytes = _sizedBytes;
var _bool = _interopRequireWildcard(require("./bool"));
exports.bool = _bool;
var _leb = _interopRequireWildcard(require("./leb128"));
exports.leb128 = _leb;
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }