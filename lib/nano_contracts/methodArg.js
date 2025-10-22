"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NanoContractMethodArgument = void 0;
var _zod = require("zod");
var _types = require("./types");
var _utils = require("./utils");
var _address = _interopRequireDefault(require("../models/address"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/**
 * Refinement method meant to validate, parse and return the transformed type.
 * User input will be parsed, validated and converted to the actual internal TS type.
 * Issues are added to the context so zod can show parse errors safely.
 */
function refineSingleValue(ctx, inputVal, type) {
  if (type === 'int' || type === 'Timestamp') {
    const parse = _zod.z.coerce.number().safeParse(inputVal);
    if (!parse.success) {
      ctx.addIssue({
        code: _zod.z.ZodIssueCode.custom,
        message: `Value is invalid ${type}: ${parse.error}`,
        fatal: true
      });
    } else {
      return parse.data;
    }
  } else if (type === 'VarInt' || type === 'Amount') {
    const parse = _zod.z.coerce.bigint().safeParse(inputVal);
    if (!parse.success) {
      ctx.addIssue({
        code: _zod.z.ZodIssueCode.custom,
        message: `Value is invalid ${type}: ${parse.error}`,
        fatal: true
      });
    } else {
      return parse.data;
    }
  } else if (_types.NanoContractArgumentByteTypes.safeParse(type).success) {
    const parse = _zod.z.string().regex(/^[0-9A-Fa-f]+$/).transform(val => Buffer.from(val, 'hex')).safeParse(inputVal);
    if (!parse.success) {
      ctx.addIssue({
        code: _zod.z.ZodIssueCode.custom,
        message: `Value is invalid ${type}: ${parse.error}`,
        fatal: true
      });
    } else {
      return parse.data;
    }
  } else if (type === 'bool') {
    const parse = _zod.z.boolean().or(_zod.z.union([_zod.z.literal('true'), _zod.z.literal('false')]).transform(val => val === 'true')).safeParse(inputVal);
    if (!parse.success) {
      ctx.addIssue({
        code: _zod.z.ZodIssueCode.custom,
        message: `Value is invalid bool: ${parse.error}`,
        fatal: true
      });
    } else {
      return parse.data;
    }
  } else if (type === 'str') {
    const parse = _zod.z.string().safeParse(inputVal);
    if (!parse.success) {
      ctx.addIssue({
        code: _zod.z.ZodIssueCode.custom,
        message: `Value is invalid str: ${parse.error}`,
        fatal: true
      });
    } else {
      return parse.data;
    }
  } else if (type === 'Address') {
    const parse = _zod.z.string().safeParse(inputVal);
    if (!parse.success) {
      ctx.addIssue({
        code: _zod.z.ZodIssueCode.custom,
        message: `Value is invalid Address: ${parse.error}`,
        fatal: true
      });
    } else {
      const address = new _address.default(parse.data);
      try {
        address.validateAddress({
          skipNetwork: true
        });
        return parse.data;
      } catch (err) {
        ctx.addIssue({
          code: _zod.z.ZodIssueCode.custom,
          message: `Value is invalid Address: ${err instanceof Error ? err.message : String(err)}`,
          fatal: true
        });
      }
    }
  } else {
    // No known types match the given type
    ctx.addIssue({
      code: _zod.z.ZodIssueCode.custom,
      message: `Type(${type}) is not supported as a 'single' type`,
      fatal: true
    });
  }

  // Meant to keep the typing correct
  return _zod.z.NEVER;
}

/**
 * Type and value validation for non-container types.
 * Returns the internal parsed value for the argument given.
 */
const SingleValueApiInputScheme = _zod.z.tuple([_types.NanoContractArgumentSingleTypeNameSchema,
// type
_types.NanoContractArgumentApiInputSchema // value
]).transform((value, ctx) => {
  return refineSingleValue(ctx, value[1], value[0]);
});

/**
 * Type and value validation for Optional types.
 * Returns the internal TS type for the argument given.
 */
const OptionalApiInputScheme = _zod.z.tuple([_types.NanoContractArgumentSingleTypeNameSchema,
// Inner type
_types.NanoContractArgumentApiInputSchema // value
]).transform((value, ctx) => {
  const parse = _zod.z.null().safeParse(value[1]);
  if (parse.success) {
    return parse.data;
  }
  // value is not null, should transform based on the type
  return refineSingleValue(ctx, value[1], value[0]);
});

/**
 * Type and value validation for SignedData types.
 * returns an instance of NanoContractSignedData
 */
const SignedDataApiInputScheme = _zod.z.string().transform(value => value.split(',')).pipe(_zod.z.tuple([_zod.z.string().regex(/^[0-9A-Fa-f]+$/), _zod.z.string(), _types.NanoContractArgumentSingleTypeNameSchema])).transform((value, ctx) => {
  const signature = Buffer.from(value[0], 'hex');
  const type = value[2];
  const refinedValue = refineSingleValue(ctx, value[1], type);
  const ret = {
    signature,
    type,
    value: refinedValue
  };
  return ret;
});
class NanoContractMethodArgument {
  constructor(name, type, value) {
    _defineProperty(this, "name", void 0);
    _defineProperty(this, "type", void 0);
    _defineProperty(this, "value", void 0);
    _defineProperty(this, "_serialized", void 0);
    this.name = name;
    this.type = _types.NanoContractArgumentTypeNameSchema.parse(type);
    this.value = value;
    this._serialized = Buffer.alloc(0);
  }

  /**
   * Serialize the argument into bytes
   */
  serialize(serializer) {
    if (this._serialized.length === 0) {
      this._serialized = serializer.serializeFromType(this.value, this.type);
    }
    return this._serialized;
  }

  /**
   * Deserialize value from buffer and create an instance of NanoContractMethodArgument
   */
  static fromSerialized(name, type, buf, deserializer) {
    const parseResult = deserializer.deserializeFromType(buf, type);
    return {
      value: new NanoContractMethodArgument(name, type, parseResult.value),
      bytesRead: parseResult.bytesRead
    };
  }

  /**
   * User input and api serialized input may not be encoded in the actual value type.
   *
   * ## SignedData and RawSignedData
   * We expect the value as a string separated by comma (,) with 3 elements
   * (signature, value, type)
   * Since the value is encoded as a string some special cases apply:
   * - bool: 'true' or 'false'.
   * - bytes (and any bytes encoded value): hex encoded string of the byte value.
   *
   * While the value should be the NanoContractSignedDataSchema
   */
  static fromApiInput(name, type, value) {
    const isContainerType = (0, _utils.getContainerType)(type) !== null;
    if (isContainerType) {
      const [containerType, innerType] = (0, _utils.getContainerInternalType)(type);
      if (containerType === 'SignedData' || containerType === 'RawSignedData') {
        // Parse string SignedData into NanoContractSignedData
        const data = SignedDataApiInputScheme.parse(value);
        if (data.type !== innerType) {
          throw new Error('Invalid signed data type');
        }
        return new NanoContractMethodArgument(name, type, data);
      }
      if (containerType === 'Optional') {
        const data = OptionalApiInputScheme.parse([innerType, value]);
        return new NanoContractMethodArgument(name, type, data);
      }
      // XXX: add special case for Tuple

      throw new Error(`ContainerType(${containerType}) is not supported as api input.`);
    }
    // This is a single value type
    const data = SingleValueApiInputScheme.parse([type, value]);
    return new NanoContractMethodArgument(name, type, data);
  }

  /**
   * This is a helper method, so we can create the api input representation of the arg value.
   */
  toApiInput() {
    return {
      name: this.name,
      type: this.type,
      parsed: NanoContractMethodArgument.prepValue(this.value, this.type)
    };
  }

  /**
   * Prepare value for ApiInput, converting single types to NanoContractArgumentApiInputType
   */
  static prepSingleValue(value, type) {
    if (type === 'bool') {
      return value ? 'true' : 'false';
    }
    if (_types.NanoContractArgumentByteTypes.safeParse(type).success) {
      return value.toString('hex');
    }
    if (value instanceof Buffer) {
      // Should not happen since all bytes values were caught, this is to satisfy typing
      return value.toString('hex');
    }
    if (type === 'VarInt' || type === 'Amount') {
      return String(value);
    }
    return value;
  }

  /**
   * Prepare value for ApiInput, converting any type to NanoContractArgumentApiInputType
   * Works for container values, converting the inner value as well if needed
   */
  static prepValue(value, type) {
    const isContainerType = (0, _utils.getContainerType)(type) !== null;
    if (isContainerType) {
      const [containerType, innerType] = (0, _utils.getContainerInternalType)(type);
      if (containerType === 'SignedData' || containerType === 'RawSignedData') {
        const data = value;
        return [data.signature.toString('hex'), NanoContractMethodArgument.prepSingleValue(data.value, data.type), innerType].join(',');
      }
      if (containerType === 'Optional') {
        if (value === null) {
          return null;
        }
        return NanoContractMethodArgument.prepSingleValue(value, _types.NanoContractArgumentSingleTypeNameSchema.parse(innerType));
      }
      throw new Error(`Untreated container type(${type}) for value ${value}`);
    }
    return NanoContractMethodArgument.prepSingleValue(_types.NanoContractArgumentSingleSchema.parse(value), _types.NanoContractArgumentSingleTypeNameSchema.parse(type));
  }
}
exports.NanoContractMethodArgument = NanoContractMethodArgument;