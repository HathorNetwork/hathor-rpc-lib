"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bigIntCoercibleSchema = exports.JSONBigInt = void 0;
exports.parseJsonBigInt = parseJsonBigInt;
exports.parseSchema = parseSchema;
exports.transformJsonBigIntResponse = transformJsonBigIntResponse;
var _zod = require("zod");
var _types = require("../types");
/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * An object equivalent to the native global JSON, providing `parse()` and `stringify()` functions with compatible signatures, except
 * for the `reviver` and `replacer` parameters that are not supported to prevent accidental override of the custom BigInt behavior.
 *
 * If the JSON string to be parsed contains large integers that would lose precision with the `number` type, they're parsed as `bigint`s,
 * and analogously for `stringify`. The `any` type is allowed as it conforms to the original signatures.
 */
const JSONBigInt = exports.JSONBigInt = {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  parse(text) {
    // @ts-expect-error TypeScript hasn't been updated with the `context` argument from Node v22.
    return JSON.parse(text, this.bigIntReviver);
  },
  stringify(value, space) {
    return JSON.stringify(value, this.bigIntReplacer, space);
  },
  bigIntReviver(_key, value, context) {
    if (typeof value !== 'number') {
      // No special handling needed for non-number values.
      return value;
    }
    try {
      const bigIntValue = BigInt(context.source);
      if (bigIntValue < Number.MIN_SAFE_INTEGER || bigIntValue > Number.MAX_SAFE_INTEGER) {
        // We only return the value as a BigInt if it's in the unsafe range.
        return bigIntValue;
      }

      // Otherwise, we can keep it as a Number.
      return value;
    } catch (e) {
      if (e instanceof SyntaxError && (e.message === `Cannot convert ${context.source} to a BigInt` || e.message === `invalid BigInt syntax`)) {
        // When this error happens, it means the number cannot be converted to a BigInt,
        // so it's a double, for example '123.456' or '1e2'.
        return value;
      }
      // This should never happen, any other error thrown by BigInt() is unexpected.
      const logger = (0, _types.getDefaultLogger)();
      logger.error(`unexpected error in bigIntReviver: ${e}`);
      throw e;
    }
  },
  bigIntReplacer(_key, value_) {
    // If the value is a BigInt, we simply return its string representation.
    // @ts-expect-error TypeScript hasn't been updated with the `rawJSON` function from Node v22.
    return typeof value_ === 'bigint' ? JSON.rawJSON(value_.toString()) : value_;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
};

/**
 * A utility Zod schema for `bigint` properties that can be instantiated from a coercible type, that is, a `number`, `string`, or `bigint` itself.
 */
const bigIntCoercibleSchema = exports.bigIntCoercibleSchema = _zod.z.bigint().or(_zod.z.number()).or(_zod.z.string()).pipe(_zod.z.coerce.bigint());

/**
 * A type alias for a Zod schema with `unknown` input and generic output.
 */

/**
 * Parse some `unknown` data with a Zod schema. If parsing fails, it logs the error and throws.
 */
function parseSchema(data, schema) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const logger = (0, _types.getDefaultLogger)();
    logger.error(`error: ${result.error.message}\ncaused by input: ${JSONBigInt.stringify(data)}`);
    throw result.error;
  }
  return result.data;
}

/**
 * Parse some JSON string with a Zod schema.
 *
 * If the JSON string contains large integers that would lose precision with the `number` type, they're parsed as `bigint`s.
 * This means that `z.bigint()` properties would fail for small integers, as they would be parsed as `number`s.
 * To mitigate this, use the `bigIntCoercibleSchema` utility, which will coerce the property to a `bigint` output.
 *
 * If parsing fails, it logs the error and throws.
 */
function parseJsonBigInt(text, schema) {
  const jsonSchema = _zod.z.string().transform((str, ctx) => {
    try {
      return JSONBigInt.parse(str);
    } catch (e) {
      ctx.addIssue({
        code: _zod.z.ZodIssueCode.custom,
        message: `Could not parse with JSONBigInt. Error: ${e}`
      });
      return _zod.z.NEVER;
    }
  }).pipe(schema);
  return parseSchema(text, jsonSchema);
}

/**
 * A utility function to be used with `transformResponse` in Axios requests with support for `bigint` properties, powered by Zod schemas.
 *
 * If the JSON string contains large integers that would lose precision with the `number` type, they're parsed as `bigint`s.
 * This means that `z.bigint()` properties would fail for small integers, as they would be parsed as `number`s.
 * To mitigate this, use the `bigIntCoercibleSchema` utility, which will coerce the property to a `bigint` output.
 */
function transformJsonBigIntResponse(data, schema) {
  return typeof data === 'string' ? parseJsonBigInt(data, schema) : parseSchema(data, schema);
}