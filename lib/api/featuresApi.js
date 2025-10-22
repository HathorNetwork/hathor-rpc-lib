"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFeaturesSchema = exports.getBlockFeaturesSuccessSchema = exports.getBlockFeaturesSchema = exports.getBlockFeatureSignalBitSchema = exports.featureActivationSchema = exports.errorSchema = exports.default = void 0;
var _zod = require("zod");
var _axiosInstance = require("./axiosInstance");
var _bigint = require("../utils/bigint");
/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const featureActivationSchema = exports.featureActivationSchema = _zod.z.object({
  name: _zod.z.string(),
  state: _zod.z.string(),
  acceptance: _zod.z.number().nullish(),
  threshold: _zod.z.number(),
  start_height: _zod.z.number(),
  minimum_activation_height: _zod.z.number(),
  timeout_height: _zod.z.number(),
  lock_in_on_timeout: _zod.z.boolean(),
  version: _zod.z.string()
}).passthrough();
const getFeaturesSchema = exports.getFeaturesSchema = _zod.z.object({
  block_hash: _zod.z.string(),
  block_height: _zod.z.number().min(0),
  features: _zod.z.array(featureActivationSchema)
}).passthrough();
const errorSchema = exports.errorSchema = _zod.z.object({
  success: _zod.z.literal(false),
  error: _zod.z.string()
});
const getBlockFeatureSignalBitSchema = exports.getBlockFeatureSignalBitSchema = _zod.z.object({
  bit: _zod.z.number(),
  signal: _zod.z.number(),
  feature: _zod.z.string(),
  feature_state: _zod.z.string()
}).passthrough();
const getBlockFeaturesSuccessSchema = exports.getBlockFeaturesSuccessSchema = _zod.z.object({
  signal_bits: _zod.z.array(getBlockFeatureSignalBitSchema)
}).passthrough();
const getBlockFeaturesSchema = exports.getBlockFeaturesSchema = _zod.z.union([getBlockFeaturesSuccessSchema, errorSchema]);
const featuresApi = {
  /**
   * Get feature activation information
   */
  async getFeatures() {
    return new Promise((resolve, reject) => {
      // @ts-expect-error XXX: createRequestInstance resolve argument is not typed correctly
      (0, _axiosInstance.createRequestInstance)(resolve).get(`feature`, {
        transformResponse: res => (0, _bigint.transformJsonBigIntResponse)(res, getFeaturesSchema)
      }).then(res => {
        resolve(res.data);
      }, res => {
        reject(res);
      });
    });
  },
  /**
   * Get block features information
   * @param blockHash Block id encoded as hex
   */
  async getBlockFeatures(blockHash) {
    return new Promise((resolve, reject) => {
      // @ts-expect-error XXX: createRequestInstance resolve argument is not typed correctly
      (0, _axiosInstance.createRequestInstance)(resolve).get(`feature`, {
        params: {
          block: blockHash
        },
        transformResponse: res => (0, _bigint.transformJsonBigIntResponse)(res, getBlockFeaturesSchema)
      }).then(res => {
        resolve(res.data);
      }, res => {
        reject(res);
      });
    });
  }
};
var _default = exports.default = featuresApi;