/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { z } from 'zod';
export declare const featureActivationSchema: z.ZodObject<{
    name: z.ZodString;
    state: z.ZodString;
    acceptance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    threshold: z.ZodNumber;
    start_height: z.ZodNumber;
    minimum_activation_height: z.ZodNumber;
    timeout_height: z.ZodNumber;
    lock_in_on_timeout: z.ZodBoolean;
    version: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    name: z.ZodString;
    state: z.ZodString;
    acceptance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    threshold: z.ZodNumber;
    start_height: z.ZodNumber;
    minimum_activation_height: z.ZodNumber;
    timeout_height: z.ZodNumber;
    lock_in_on_timeout: z.ZodBoolean;
    version: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    name: z.ZodString;
    state: z.ZodString;
    acceptance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    threshold: z.ZodNumber;
    start_height: z.ZodNumber;
    minimum_activation_height: z.ZodNumber;
    timeout_height: z.ZodNumber;
    lock_in_on_timeout: z.ZodBoolean;
    version: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export declare const getFeaturesSchema: z.ZodObject<{
    block_hash: z.ZodString;
    block_height: z.ZodNumber;
    features: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        state: z.ZodString;
        acceptance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        threshold: z.ZodNumber;
        start_height: z.ZodNumber;
        minimum_activation_height: z.ZodNumber;
        timeout_height: z.ZodNumber;
        lock_in_on_timeout: z.ZodBoolean;
        version: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodString;
        state: z.ZodString;
        acceptance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        threshold: z.ZodNumber;
        start_height: z.ZodNumber;
        minimum_activation_height: z.ZodNumber;
        timeout_height: z.ZodNumber;
        lock_in_on_timeout: z.ZodBoolean;
        version: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodString;
        state: z.ZodString;
        acceptance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        threshold: z.ZodNumber;
        start_height: z.ZodNumber;
        minimum_activation_height: z.ZodNumber;
        timeout_height: z.ZodNumber;
        lock_in_on_timeout: z.ZodBoolean;
        version: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    block_hash: z.ZodString;
    block_height: z.ZodNumber;
    features: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        state: z.ZodString;
        acceptance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        threshold: z.ZodNumber;
        start_height: z.ZodNumber;
        minimum_activation_height: z.ZodNumber;
        timeout_height: z.ZodNumber;
        lock_in_on_timeout: z.ZodBoolean;
        version: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodString;
        state: z.ZodString;
        acceptance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        threshold: z.ZodNumber;
        start_height: z.ZodNumber;
        minimum_activation_height: z.ZodNumber;
        timeout_height: z.ZodNumber;
        lock_in_on_timeout: z.ZodBoolean;
        version: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodString;
        state: z.ZodString;
        acceptance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        threshold: z.ZodNumber;
        start_height: z.ZodNumber;
        minimum_activation_height: z.ZodNumber;
        timeout_height: z.ZodNumber;
        lock_in_on_timeout: z.ZodBoolean;
        version: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    block_hash: z.ZodString;
    block_height: z.ZodNumber;
    features: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        state: z.ZodString;
        acceptance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        threshold: z.ZodNumber;
        start_height: z.ZodNumber;
        minimum_activation_height: z.ZodNumber;
        timeout_height: z.ZodNumber;
        lock_in_on_timeout: z.ZodBoolean;
        version: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        name: z.ZodString;
        state: z.ZodString;
        acceptance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        threshold: z.ZodNumber;
        start_height: z.ZodNumber;
        minimum_activation_height: z.ZodNumber;
        timeout_height: z.ZodNumber;
        lock_in_on_timeout: z.ZodBoolean;
        version: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        name: z.ZodString;
        state: z.ZodString;
        acceptance: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        threshold: z.ZodNumber;
        start_height: z.ZodNumber;
        minimum_activation_height: z.ZodNumber;
        timeout_height: z.ZodNumber;
        lock_in_on_timeout: z.ZodBoolean;
        version: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">>;
export declare const errorSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodString;
}, "strip", z.ZodTypeAny, {
    error: string;
    success: false;
}, {
    error: string;
    success: false;
}>;
export declare const getBlockFeatureSignalBitSchema: z.ZodObject<{
    bit: z.ZodNumber;
    signal: z.ZodNumber;
    feature: z.ZodString;
    feature_state: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    bit: z.ZodNumber;
    signal: z.ZodNumber;
    feature: z.ZodString;
    feature_state: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    bit: z.ZodNumber;
    signal: z.ZodNumber;
    feature: z.ZodString;
    feature_state: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export declare const getBlockFeaturesSuccessSchema: z.ZodObject<{
    signal_bits: z.ZodArray<z.ZodObject<{
        bit: z.ZodNumber;
        signal: z.ZodNumber;
        feature: z.ZodString;
        feature_state: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        bit: z.ZodNumber;
        signal: z.ZodNumber;
        feature: z.ZodString;
        feature_state: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        bit: z.ZodNumber;
        signal: z.ZodNumber;
        feature: z.ZodString;
        feature_state: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    signal_bits: z.ZodArray<z.ZodObject<{
        bit: z.ZodNumber;
        signal: z.ZodNumber;
        feature: z.ZodString;
        feature_state: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        bit: z.ZodNumber;
        signal: z.ZodNumber;
        feature: z.ZodString;
        feature_state: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        bit: z.ZodNumber;
        signal: z.ZodNumber;
        feature: z.ZodString;
        feature_state: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    signal_bits: z.ZodArray<z.ZodObject<{
        bit: z.ZodNumber;
        signal: z.ZodNumber;
        feature: z.ZodString;
        feature_state: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        bit: z.ZodNumber;
        signal: z.ZodNumber;
        feature: z.ZodString;
        feature_state: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        bit: z.ZodNumber;
        signal: z.ZodNumber;
        feature: z.ZodString;
        feature_state: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">>;
export declare const getBlockFeaturesSchema: z.ZodUnion<[z.ZodObject<{
    signal_bits: z.ZodArray<z.ZodObject<{
        bit: z.ZodNumber;
        signal: z.ZodNumber;
        feature: z.ZodString;
        feature_state: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        bit: z.ZodNumber;
        signal: z.ZodNumber;
        feature: z.ZodString;
        feature_state: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        bit: z.ZodNumber;
        signal: z.ZodNumber;
        feature: z.ZodString;
        feature_state: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    signal_bits: z.ZodArray<z.ZodObject<{
        bit: z.ZodNumber;
        signal: z.ZodNumber;
        feature: z.ZodString;
        feature_state: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        bit: z.ZodNumber;
        signal: z.ZodNumber;
        feature: z.ZodString;
        feature_state: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        bit: z.ZodNumber;
        signal: z.ZodNumber;
        feature: z.ZodString;
        feature_state: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    signal_bits: z.ZodArray<z.ZodObject<{
        bit: z.ZodNumber;
        signal: z.ZodNumber;
        feature: z.ZodString;
        feature_state: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        bit: z.ZodNumber;
        signal: z.ZodNumber;
        feature: z.ZodString;
        feature_state: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        bit: z.ZodNumber;
        signal: z.ZodNumber;
        feature: z.ZodString;
        feature_state: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodString;
}, "strip", z.ZodTypeAny, {
    error: string;
    success: false;
}, {
    error: string;
    success: false;
}>]>;
declare const featuresApi: {
    /**
     * Get feature activation information
     */
    getFeatures(): Promise<z.output<typeof getFeaturesSchema>>;
    /**
     * Get block features information
     * @param blockHash Block id encoded as hex
     */
    getBlockFeatures(blockHash: string): Promise<z.output<typeof getBlockFeaturesSchema>>;
};
export default featuresApi;
//# sourceMappingURL=featuresApi.d.ts.map