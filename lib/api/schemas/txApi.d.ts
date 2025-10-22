/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { z } from 'zod';
export declare const decodedSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"P2PKH">;
    address: z.ZodString;
    timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
    token_data: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "P2PKH";
    address: string;
    value: bigint;
    token_data: number;
    timelock?: number | null | undefined;
}, {
    type: "P2PKH";
    address: string;
    value: string | number | bigint;
    token_data: number;
    timelock?: number | null | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"MultiSig">;
    address: z.ZodString;
    timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
    token_data: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "MultiSig";
    address: string;
    value: bigint;
    token_data: number;
    timelock?: number | null | undefined;
}, {
    type: "MultiSig";
    address: string;
    value: string | number | bigint;
    token_data: number;
    timelock?: number | null | undefined;
}>, z.ZodObject<{
    type: z.ZodUndefined;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    type: z.ZodUndefined;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    type: z.ZodUndefined;
}, z.ZodTypeAny, "passthrough">>]>;
export declare const fullnodeTxApiInputSchema: z.ZodObject<{
    value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
    token_data: z.ZodNumber;
    script: z.ZodString;
    decoded: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"P2PKH">;
        address: z.ZodString;
        timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        token_data: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "P2PKH";
        address: string;
        value: bigint;
        token_data: number;
        timelock?: number | null | undefined;
    }, {
        type: "P2PKH";
        address: string;
        value: string | number | bigint;
        token_data: number;
        timelock?: number | null | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"MultiSig">;
        address: z.ZodString;
        timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        token_data: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "MultiSig";
        address: string;
        value: bigint;
        token_data: number;
        timelock?: number | null | undefined;
    }, {
        type: "MultiSig";
        address: string;
        value: string | number | bigint;
        token_data: number;
        timelock?: number | null | undefined;
    }>, z.ZodObject<{
        type: z.ZodUndefined;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodUndefined;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodUndefined;
    }, z.ZodTypeAny, "passthrough">>]>;
    tx_id: z.ZodString;
    index: z.ZodNumber;
    token: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    index: number;
    value: bigint;
    script: string;
    token_data: number;
    decoded: {
        type: "P2PKH";
        address: string;
        value: bigint;
        token_data: number;
        timelock?: number | null | undefined;
    } | {
        type: "MultiSig";
        address: string;
        value: bigint;
        token_data: number;
        timelock?: number | null | undefined;
    } | z.objectOutputType<{
        type: z.ZodUndefined;
    }, z.ZodTypeAny, "passthrough">;
    tx_id: string;
    token?: string | null | undefined;
}, {
    index: number;
    value: string | number | bigint;
    script: string;
    token_data: number;
    decoded: {
        type: "P2PKH";
        address: string;
        value: string | number | bigint;
        token_data: number;
        timelock?: number | null | undefined;
    } | {
        type: "MultiSig";
        address: string;
        value: string | number | bigint;
        token_data: number;
        timelock?: number | null | undefined;
    } | z.objectInputType<{
        type: z.ZodUndefined;
    }, z.ZodTypeAny, "passthrough">;
    tx_id: string;
    token?: string | null | undefined;
}>;
export declare const fullnodeTxApiOutputSchema: z.ZodObject<{
    value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
    token_data: z.ZodNumber;
    script: z.ZodString;
    decoded: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"P2PKH">;
        address: z.ZodString;
        timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        token_data: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "P2PKH";
        address: string;
        value: bigint;
        token_data: number;
        timelock?: number | null | undefined;
    }, {
        type: "P2PKH";
        address: string;
        value: string | number | bigint;
        token_data: number;
        timelock?: number | null | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"MultiSig">;
        address: z.ZodString;
        timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        token_data: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "MultiSig";
        address: string;
        value: bigint;
        token_data: number;
        timelock?: number | null | undefined;
    }, {
        type: "MultiSig";
        address: string;
        value: string | number | bigint;
        token_data: number;
        timelock?: number | null | undefined;
    }>, z.ZodObject<{
        type: z.ZodUndefined;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodUndefined;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodUndefined;
    }, z.ZodTypeAny, "passthrough">>]>;
    token: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    spent_by: z.ZodDefault<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    value: bigint;
    script: string;
    token_data: number;
    decoded: {
        type: "P2PKH";
        address: string;
        value: bigint;
        token_data: number;
        timelock?: number | null | undefined;
    } | {
        type: "MultiSig";
        address: string;
        value: bigint;
        token_data: number;
        timelock?: number | null | undefined;
    } | z.objectOutputType<{
        type: z.ZodUndefined;
    }, z.ZodTypeAny, "passthrough">;
    spent_by: string | null;
    token?: string | null | undefined;
}, {
    value: string | number | bigint;
    script: string;
    token_data: number;
    decoded: {
        type: "P2PKH";
        address: string;
        value: string | number | bigint;
        token_data: number;
        timelock?: number | null | undefined;
    } | {
        type: "MultiSig";
        address: string;
        value: string | number | bigint;
        token_data: number;
        timelock?: number | null | undefined;
    } | z.objectInputType<{
        type: z.ZodUndefined;
    }, z.ZodTypeAny, "passthrough">;
    token?: string | null | undefined;
    spent_by?: string | null | undefined;
}>;
export declare const fullnodeTxApiTokenSchema: z.ZodObject<{
    uid: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
    symbol: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    symbol: string | null;
    name: string | null;
    uid: string;
}, {
    symbol: string | null;
    name: string | null;
    uid: string;
}>;
export declare const fullnodeTxApiTxSchema: z.ZodObject<{
    hash: z.ZodString;
    nonce: z.ZodString;
    timestamp: z.ZodNumber;
    version: z.ZodNumber;
    weight: z.ZodNumber;
    signal_bits: z.ZodNumber;
    parents: z.ZodArray<z.ZodString, "many">;
    nc_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nc_method: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nc_pubkey: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nc_address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nc_context: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        actions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"deposit">;
        }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"deposit">;
        }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"deposit">;
        }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"withdrawal">;
        }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"withdrawal">;
        }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"withdrawal">;
        }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"grant_authority">;
        }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"grant_authority">;
        }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"grant_authority">;
        }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"acquire_authority">;
        }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"acquire_authority">;
        }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"acquire_authority">;
        }>, z.ZodTypeAny, "passthrough">>]>, "many">;
        address: z.ZodString;
        timestamp: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        actions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"deposit">;
        }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"deposit">;
        }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"deposit">;
        }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"withdrawal">;
        }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"withdrawal">;
        }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"withdrawal">;
        }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"grant_authority">;
        }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"grant_authority">;
        }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"grant_authority">;
        }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"acquire_authority">;
        }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"acquire_authority">;
        }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"acquire_authority">;
        }>, z.ZodTypeAny, "passthrough">>]>, "many">;
        address: z.ZodString;
        timestamp: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        actions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"deposit">;
        }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"deposit">;
        }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"deposit">;
        }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"withdrawal">;
        }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"withdrawal">;
        }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"withdrawal">;
        }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"grant_authority">;
        }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"grant_authority">;
        }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"grant_authority">;
        }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"acquire_authority">;
        }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"acquire_authority">;
        }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"acquire_authority">;
        }>, z.ZodTypeAny, "passthrough">>]>, "many">;
        address: z.ZodString;
        timestamp: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>>>;
    nc_args: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nc_blueprint_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    inputs: z.ZodArray<z.ZodObject<{
        value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        token_data: z.ZodNumber;
        script: z.ZodString;
        decoded: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
            type: z.ZodLiteral<"P2PKH">;
            address: z.ZodString;
            timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            token_data: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            type: "P2PKH";
            address: string;
            value: bigint;
            token_data: number;
            timelock?: number | null | undefined;
        }, {
            type: "P2PKH";
            address: string;
            value: string | number | bigint;
            token_data: number;
            timelock?: number | null | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"MultiSig">;
            address: z.ZodString;
            timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            token_data: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            type: "MultiSig";
            address: string;
            value: bigint;
            token_data: number;
            timelock?: number | null | undefined;
        }, {
            type: "MultiSig";
            address: string;
            value: string | number | bigint;
            token_data: number;
            timelock?: number | null | undefined;
        }>, z.ZodObject<{
            type: z.ZodUndefined;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodUndefined;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodUndefined;
        }, z.ZodTypeAny, "passthrough">>]>;
        tx_id: z.ZodString;
        index: z.ZodNumber;
        token: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        index: number;
        value: bigint;
        script: string;
        token_data: number;
        decoded: {
            type: "P2PKH";
            address: string;
            value: bigint;
            token_data: number;
            timelock?: number | null | undefined;
        } | {
            type: "MultiSig";
            address: string;
            value: bigint;
            token_data: number;
            timelock?: number | null | undefined;
        } | z.objectOutputType<{
            type: z.ZodUndefined;
        }, z.ZodTypeAny, "passthrough">;
        tx_id: string;
        token?: string | null | undefined;
    }, {
        index: number;
        value: string | number | bigint;
        script: string;
        token_data: number;
        decoded: {
            type: "P2PKH";
            address: string;
            value: string | number | bigint;
            token_data: number;
            timelock?: number | null | undefined;
        } | {
            type: "MultiSig";
            address: string;
            value: string | number | bigint;
            token_data: number;
            timelock?: number | null | undefined;
        } | z.objectInputType<{
            type: z.ZodUndefined;
        }, z.ZodTypeAny, "passthrough">;
        tx_id: string;
        token?: string | null | undefined;
    }>, "many">;
    outputs: z.ZodArray<z.ZodObject<{
        value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        token_data: z.ZodNumber;
        script: z.ZodString;
        decoded: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
            type: z.ZodLiteral<"P2PKH">;
            address: z.ZodString;
            timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            token_data: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            type: "P2PKH";
            address: string;
            value: bigint;
            token_data: number;
            timelock?: number | null | undefined;
        }, {
            type: "P2PKH";
            address: string;
            value: string | number | bigint;
            token_data: number;
            timelock?: number | null | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"MultiSig">;
            address: z.ZodString;
            timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            token_data: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            type: "MultiSig";
            address: string;
            value: bigint;
            token_data: number;
            timelock?: number | null | undefined;
        }, {
            type: "MultiSig";
            address: string;
            value: string | number | bigint;
            token_data: number;
            timelock?: number | null | undefined;
        }>, z.ZodObject<{
            type: z.ZodUndefined;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodUndefined;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodUndefined;
        }, z.ZodTypeAny, "passthrough">>]>;
        token: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        spent_by: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        value: bigint;
        script: string;
        token_data: number;
        decoded: {
            type: "P2PKH";
            address: string;
            value: bigint;
            token_data: number;
            timelock?: number | null | undefined;
        } | {
            type: "MultiSig";
            address: string;
            value: bigint;
            token_data: number;
            timelock?: number | null | undefined;
        } | z.objectOutputType<{
            type: z.ZodUndefined;
        }, z.ZodTypeAny, "passthrough">;
        spent_by: string | null;
        token?: string | null | undefined;
    }, {
        value: string | number | bigint;
        script: string;
        token_data: number;
        decoded: {
            type: "P2PKH";
            address: string;
            value: string | number | bigint;
            token_data: number;
            timelock?: number | null | undefined;
        } | {
            type: "MultiSig";
            address: string;
            value: string | number | bigint;
            token_data: number;
            timelock?: number | null | undefined;
        } | z.objectInputType<{
            type: z.ZodUndefined;
        }, z.ZodTypeAny, "passthrough">;
        token?: string | null | undefined;
        spent_by?: string | null | undefined;
    }>, "many">;
    tokens: z.ZodArray<z.ZodObject<{
        uid: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
        symbol: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        symbol: string | null;
        name: string | null;
        uid: string;
    }, {
        symbol: string | null;
        name: string | null;
        uid: string;
    }>, "many">;
    token_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    token_symbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    raw: z.ZodString;
}, "strip", z.ZodTypeAny, {
    raw: string;
    nonce: string;
    hash: string;
    tokens: {
        symbol: string | null;
        name: string | null;
        uid: string;
    }[];
    timestamp: number;
    version: number;
    weight: number;
    inputs: {
        index: number;
        value: bigint;
        script: string;
        token_data: number;
        decoded: {
            type: "P2PKH";
            address: string;
            value: bigint;
            token_data: number;
            timelock?: number | null | undefined;
        } | {
            type: "MultiSig";
            address: string;
            value: bigint;
            token_data: number;
            timelock?: number | null | undefined;
        } | z.objectOutputType<{
            type: z.ZodUndefined;
        }, z.ZodTypeAny, "passthrough">;
        tx_id: string;
        token?: string | null | undefined;
    }[];
    outputs: {
        value: bigint;
        script: string;
        token_data: number;
        decoded: {
            type: "P2PKH";
            address: string;
            value: bigint;
            token_data: number;
            timelock?: number | null | undefined;
        } | {
            type: "MultiSig";
            address: string;
            value: bigint;
            token_data: number;
            timelock?: number | null | undefined;
        } | z.objectOutputType<{
            type: z.ZodUndefined;
        }, z.ZodTypeAny, "passthrough">;
        spent_by: string | null;
        token?: string | null | undefined;
    }[];
    parents: string[];
    signal_bits: number;
    token_name?: string | null | undefined;
    token_symbol?: string | null | undefined;
    nc_id?: string | null | undefined;
    nc_blueprint_id?: string | null | undefined;
    nc_method?: string | null | undefined;
    nc_args?: string | null | undefined;
    nc_pubkey?: string | null | undefined;
    nc_address?: string | null | undefined;
    nc_context?: z.objectOutputType<{
        actions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"deposit">;
        }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"deposit">;
        }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"deposit">;
        }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"withdrawal">;
        }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"withdrawal">;
        }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"withdrawal">;
        }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"grant_authority">;
        }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"grant_authority">;
        }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"grant_authority">;
        }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"acquire_authority">;
        }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"acquire_authority">;
        }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"acquire_authority">;
        }>, z.ZodTypeAny, "passthrough">>]>, "many">;
        address: z.ZodString;
        timestamp: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough"> | null | undefined;
}, {
    raw: string;
    nonce: string;
    hash: string;
    tokens: {
        symbol: string | null;
        name: string | null;
        uid: string;
    }[];
    timestamp: number;
    version: number;
    weight: number;
    inputs: {
        index: number;
        value: string | number | bigint;
        script: string;
        token_data: number;
        decoded: {
            type: "P2PKH";
            address: string;
            value: string | number | bigint;
            token_data: number;
            timelock?: number | null | undefined;
        } | {
            type: "MultiSig";
            address: string;
            value: string | number | bigint;
            token_data: number;
            timelock?: number | null | undefined;
        } | z.objectInputType<{
            type: z.ZodUndefined;
        }, z.ZodTypeAny, "passthrough">;
        tx_id: string;
        token?: string | null | undefined;
    }[];
    outputs: {
        value: string | number | bigint;
        script: string;
        token_data: number;
        decoded: {
            type: "P2PKH";
            address: string;
            value: string | number | bigint;
            token_data: number;
            timelock?: number | null | undefined;
        } | {
            type: "MultiSig";
            address: string;
            value: string | number | bigint;
            token_data: number;
            timelock?: number | null | undefined;
        } | z.objectInputType<{
            type: z.ZodUndefined;
        }, z.ZodTypeAny, "passthrough">;
        token?: string | null | undefined;
        spent_by?: string | null | undefined;
    }[];
    parents: string[];
    signal_bits: number;
    token_name?: string | null | undefined;
    token_symbol?: string | null | undefined;
    nc_id?: string | null | undefined;
    nc_blueprint_id?: string | null | undefined;
    nc_method?: string | null | undefined;
    nc_args?: string | null | undefined;
    nc_pubkey?: string | null | undefined;
    nc_address?: string | null | undefined;
    nc_context?: z.objectInputType<{
        actions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"deposit">;
        }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"deposit">;
        }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"deposit">;
        }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"withdrawal">;
        }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"withdrawal">;
        }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }>, {
            type: z.ZodLiteral<"withdrawal">;
        }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"grant_authority">;
        }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"grant_authority">;
        }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"grant_authority">;
        }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"acquire_authority">;
        }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"acquire_authority">;
        }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
            token_uid: z.ZodString;
        }, {
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }>, {
            type: z.ZodLiteral<"acquire_authority">;
        }>, z.ZodTypeAny, "passthrough">>]>, "many">;
        address: z.ZodString;
        timestamp: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough"> | null | undefined;
}>;
export declare const fullnodeTxApiMetaSchema: z.ZodObject<{
    hash: z.ZodString;
    spent_outputs: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodArray<z.ZodString, "many">], null>, "many">;
    received_by: z.ZodArray<z.ZodString, "many">;
    children: z.ZodArray<z.ZodString, "many">;
    conflict_with: z.ZodArray<z.ZodString, "many">;
    voided_by: z.ZodArray<z.ZodString, "many">;
    twins: z.ZodArray<z.ZodString, "many">;
    accumulated_weight: z.ZodNumber;
    score: z.ZodNumber;
    height: z.ZodNumber;
    min_height: z.ZodNumber;
    feature_activation_bit_counts: z.ZodNullable<z.ZodArray<z.ZodNumber, "many">>;
    first_block: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    validation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    first_block_height: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    height: number;
    children: string[];
    hash: string;
    spent_outputs: [number, string[]][];
    received_by: string[];
    conflict_with: string[];
    voided_by: string[];
    twins: string[];
    accumulated_weight: number;
    score: number;
    min_height: number;
    feature_activation_bit_counts: number[] | null;
    validation?: string | null | undefined;
    first_block?: string | null | undefined;
    first_block_height?: number | null | undefined;
}, {
    height: number;
    children: string[];
    hash: string;
    spent_outputs: [number, string[]][];
    received_by: string[];
    conflict_with: string[];
    voided_by: string[];
    twins: string[];
    accumulated_weight: number;
    score: number;
    min_height: number;
    feature_activation_bit_counts: number[] | null;
    validation?: string | null | undefined;
    first_block?: string | null | undefined;
    first_block_height?: number | null | undefined;
}>;
export declare const transactionApiSchema: z.ZodDiscriminatedUnion<"success", [z.ZodObject<{
    success: z.ZodLiteral<true>;
    tx: z.ZodObject<{
        hash: z.ZodString;
        nonce: z.ZodString;
        timestamp: z.ZodNumber;
        version: z.ZodNumber;
        weight: z.ZodNumber;
        signal_bits: z.ZodNumber;
        parents: z.ZodArray<z.ZodString, "many">;
        nc_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        nc_method: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        nc_pubkey: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        nc_address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        nc_context: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            actions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">>]>, "many">;
            address: z.ZodString;
            timestamp: z.ZodNumber;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            actions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">>]>, "many">;
            address: z.ZodString;
            timestamp: z.ZodNumber;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            actions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">>]>, "many">;
            address: z.ZodString;
            timestamp: z.ZodNumber;
        }, z.ZodTypeAny, "passthrough">>>>;
        nc_args: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        nc_blueprint_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        inputs: z.ZodArray<z.ZodObject<{
            value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            token_data: z.ZodNumber;
            script: z.ZodString;
            decoded: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
                type: z.ZodLiteral<"P2PKH">;
                address: z.ZodString;
                timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
                token_data: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                type: "P2PKH";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }, {
                type: "P2PKH";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }>, z.ZodObject<{
                type: z.ZodLiteral<"MultiSig">;
                address: z.ZodString;
                timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
                token_data: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                type: "MultiSig";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }, {
                type: "MultiSig";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }>, z.ZodObject<{
                type: z.ZodUndefined;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">>]>;
            tx_id: z.ZodString;
            index: z.ZodNumber;
            token: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            index: number;
            value: bigint;
            script: string;
            token_data: number;
            decoded: {
                type: "P2PKH";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | {
                type: "MultiSig";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | z.objectOutputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">;
            tx_id: string;
            token?: string | null | undefined;
        }, {
            index: number;
            value: string | number | bigint;
            script: string;
            token_data: number;
            decoded: {
                type: "P2PKH";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | {
                type: "MultiSig";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | z.objectInputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">;
            tx_id: string;
            token?: string | null | undefined;
        }>, "many">;
        outputs: z.ZodArray<z.ZodObject<{
            value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            token_data: z.ZodNumber;
            script: z.ZodString;
            decoded: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
                type: z.ZodLiteral<"P2PKH">;
                address: z.ZodString;
                timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
                token_data: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                type: "P2PKH";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }, {
                type: "P2PKH";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }>, z.ZodObject<{
                type: z.ZodLiteral<"MultiSig">;
                address: z.ZodString;
                timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
                token_data: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                type: "MultiSig";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }, {
                type: "MultiSig";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }>, z.ZodObject<{
                type: z.ZodUndefined;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">>]>;
            token: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            spent_by: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            value: bigint;
            script: string;
            token_data: number;
            decoded: {
                type: "P2PKH";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | {
                type: "MultiSig";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | z.objectOutputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">;
            spent_by: string | null;
            token?: string | null | undefined;
        }, {
            value: string | number | bigint;
            script: string;
            token_data: number;
            decoded: {
                type: "P2PKH";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | {
                type: "MultiSig";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | z.objectInputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">;
            token?: string | null | undefined;
            spent_by?: string | null | undefined;
        }>, "many">;
        tokens: z.ZodArray<z.ZodObject<{
            uid: z.ZodString;
            name: z.ZodNullable<z.ZodString>;
            symbol: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            symbol: string | null;
            name: string | null;
            uid: string;
        }, {
            symbol: string | null;
            name: string | null;
            uid: string;
        }>, "many">;
        token_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        token_symbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        raw: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        hash: z.ZodString;
        nonce: z.ZodString;
        timestamp: z.ZodNumber;
        version: z.ZodNumber;
        weight: z.ZodNumber;
        signal_bits: z.ZodNumber;
        parents: z.ZodArray<z.ZodString, "many">;
        nc_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        nc_method: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        nc_pubkey: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        nc_address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        nc_context: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            actions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">>]>, "many">;
            address: z.ZodString;
            timestamp: z.ZodNumber;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            actions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">>]>, "many">;
            address: z.ZodString;
            timestamp: z.ZodNumber;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            actions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">>]>, "many">;
            address: z.ZodString;
            timestamp: z.ZodNumber;
        }, z.ZodTypeAny, "passthrough">>>>;
        nc_args: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        nc_blueprint_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        inputs: z.ZodArray<z.ZodObject<{
            value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            token_data: z.ZodNumber;
            script: z.ZodString;
            decoded: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
                type: z.ZodLiteral<"P2PKH">;
                address: z.ZodString;
                timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
                token_data: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                type: "P2PKH";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }, {
                type: "P2PKH";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }>, z.ZodObject<{
                type: z.ZodLiteral<"MultiSig">;
                address: z.ZodString;
                timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
                token_data: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                type: "MultiSig";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }, {
                type: "MultiSig";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }>, z.ZodObject<{
                type: z.ZodUndefined;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">>]>;
            tx_id: z.ZodString;
            index: z.ZodNumber;
            token: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            index: number;
            value: bigint;
            script: string;
            token_data: number;
            decoded: {
                type: "P2PKH";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | {
                type: "MultiSig";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | z.objectOutputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">;
            tx_id: string;
            token?: string | null | undefined;
        }, {
            index: number;
            value: string | number | bigint;
            script: string;
            token_data: number;
            decoded: {
                type: "P2PKH";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | {
                type: "MultiSig";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | z.objectInputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">;
            tx_id: string;
            token?: string | null | undefined;
        }>, "many">;
        outputs: z.ZodArray<z.ZodObject<{
            value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            token_data: z.ZodNumber;
            script: z.ZodString;
            decoded: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
                type: z.ZodLiteral<"P2PKH">;
                address: z.ZodString;
                timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
                token_data: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                type: "P2PKH";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }, {
                type: "P2PKH";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }>, z.ZodObject<{
                type: z.ZodLiteral<"MultiSig">;
                address: z.ZodString;
                timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
                token_data: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                type: "MultiSig";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }, {
                type: "MultiSig";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }>, z.ZodObject<{
                type: z.ZodUndefined;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">>]>;
            token: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            spent_by: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            value: bigint;
            script: string;
            token_data: number;
            decoded: {
                type: "P2PKH";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | {
                type: "MultiSig";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | z.objectOutputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">;
            spent_by: string | null;
            token?: string | null | undefined;
        }, {
            value: string | number | bigint;
            script: string;
            token_data: number;
            decoded: {
                type: "P2PKH";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | {
                type: "MultiSig";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | z.objectInputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">;
            token?: string | null | undefined;
            spent_by?: string | null | undefined;
        }>, "many">;
        tokens: z.ZodArray<z.ZodObject<{
            uid: z.ZodString;
            name: z.ZodNullable<z.ZodString>;
            symbol: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            symbol: string | null;
            name: string | null;
            uid: string;
        }, {
            symbol: string | null;
            name: string | null;
            uid: string;
        }>, "many">;
        token_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        token_symbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        raw: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        hash: z.ZodString;
        nonce: z.ZodString;
        timestamp: z.ZodNumber;
        version: z.ZodNumber;
        weight: z.ZodNumber;
        signal_bits: z.ZodNumber;
        parents: z.ZodArray<z.ZodString, "many">;
        nc_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        nc_method: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        nc_pubkey: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        nc_address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        nc_context: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            actions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">>]>, "many">;
            address: z.ZodString;
            timestamp: z.ZodNumber;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            actions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">>]>, "many">;
            address: z.ZodString;
            timestamp: z.ZodNumber;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            actions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">>]>, "many">;
            address: z.ZodString;
            timestamp: z.ZodNumber;
        }, z.ZodTypeAny, "passthrough">>>>;
        nc_args: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        nc_blueprint_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        inputs: z.ZodArray<z.ZodObject<{
            value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            token_data: z.ZodNumber;
            script: z.ZodString;
            decoded: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
                type: z.ZodLiteral<"P2PKH">;
                address: z.ZodString;
                timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
                token_data: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                type: "P2PKH";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }, {
                type: "P2PKH";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }>, z.ZodObject<{
                type: z.ZodLiteral<"MultiSig">;
                address: z.ZodString;
                timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
                token_data: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                type: "MultiSig";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }, {
                type: "MultiSig";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }>, z.ZodObject<{
                type: z.ZodUndefined;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">>]>;
            tx_id: z.ZodString;
            index: z.ZodNumber;
            token: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            index: number;
            value: bigint;
            script: string;
            token_data: number;
            decoded: {
                type: "P2PKH";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | {
                type: "MultiSig";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | z.objectOutputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">;
            tx_id: string;
            token?: string | null | undefined;
        }, {
            index: number;
            value: string | number | bigint;
            script: string;
            token_data: number;
            decoded: {
                type: "P2PKH";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | {
                type: "MultiSig";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | z.objectInputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">;
            tx_id: string;
            token?: string | null | undefined;
        }>, "many">;
        outputs: z.ZodArray<z.ZodObject<{
            value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            token_data: z.ZodNumber;
            script: z.ZodString;
            decoded: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
                type: z.ZodLiteral<"P2PKH">;
                address: z.ZodString;
                timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
                token_data: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                type: "P2PKH";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }, {
                type: "P2PKH";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }>, z.ZodObject<{
                type: z.ZodLiteral<"MultiSig">;
                address: z.ZodString;
                timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
                token_data: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                type: "MultiSig";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }, {
                type: "MultiSig";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            }>, z.ZodObject<{
                type: z.ZodUndefined;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">>]>;
            token: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            spent_by: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            value: bigint;
            script: string;
            token_data: number;
            decoded: {
                type: "P2PKH";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | {
                type: "MultiSig";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | z.objectOutputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">;
            spent_by: string | null;
            token?: string | null | undefined;
        }, {
            value: string | number | bigint;
            script: string;
            token_data: number;
            decoded: {
                type: "P2PKH";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | {
                type: "MultiSig";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | z.objectInputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">;
            token?: string | null | undefined;
            spent_by?: string | null | undefined;
        }>, "many">;
        tokens: z.ZodArray<z.ZodObject<{
            uid: z.ZodString;
            name: z.ZodNullable<z.ZodString>;
            symbol: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            symbol: string | null;
            name: string | null;
            uid: string;
        }, {
            symbol: string | null;
            name: string | null;
            uid: string;
        }>, "many">;
        token_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        token_symbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        raw: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>;
    meta: z.ZodObject<{
        hash: z.ZodString;
        spent_outputs: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodArray<z.ZodString, "many">], null>, "many">;
        received_by: z.ZodArray<z.ZodString, "many">;
        children: z.ZodArray<z.ZodString, "many">;
        conflict_with: z.ZodArray<z.ZodString, "many">;
        voided_by: z.ZodArray<z.ZodString, "many">;
        twins: z.ZodArray<z.ZodString, "many">;
        accumulated_weight: z.ZodNumber;
        score: z.ZodNumber;
        height: z.ZodNumber;
        min_height: z.ZodNumber;
        feature_activation_bit_counts: z.ZodNullable<z.ZodArray<z.ZodNumber, "many">>;
        first_block: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        validation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        first_block_height: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        hash: z.ZodString;
        spent_outputs: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodArray<z.ZodString, "many">], null>, "many">;
        received_by: z.ZodArray<z.ZodString, "many">;
        children: z.ZodArray<z.ZodString, "many">;
        conflict_with: z.ZodArray<z.ZodString, "many">;
        voided_by: z.ZodArray<z.ZodString, "many">;
        twins: z.ZodArray<z.ZodString, "many">;
        accumulated_weight: z.ZodNumber;
        score: z.ZodNumber;
        height: z.ZodNumber;
        min_height: z.ZodNumber;
        feature_activation_bit_counts: z.ZodNullable<z.ZodArray<z.ZodNumber, "many">>;
        first_block: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        validation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        first_block_height: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        hash: z.ZodString;
        spent_outputs: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodArray<z.ZodString, "many">], null>, "many">;
        received_by: z.ZodArray<z.ZodString, "many">;
        children: z.ZodArray<z.ZodString, "many">;
        conflict_with: z.ZodArray<z.ZodString, "many">;
        voided_by: z.ZodArray<z.ZodString, "many">;
        twins: z.ZodArray<z.ZodString, "many">;
        accumulated_weight: z.ZodNumber;
        score: z.ZodNumber;
        height: z.ZodNumber;
        min_height: z.ZodNumber;
        feature_activation_bit_counts: z.ZodNullable<z.ZodArray<z.ZodNumber, "many">>;
        first_block: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        validation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        first_block_height: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.ZodTypeAny, "passthrough">>;
    spent_outputs: z.ZodRecord<z.ZodNumber, z.ZodString>;
}, "strip", z.ZodTypeAny, {
    meta: {
        height: number;
        children: string[];
        hash: string;
        spent_outputs: [number, string[]][];
        received_by: string[];
        conflict_with: string[];
        voided_by: string[];
        twins: string[];
        accumulated_weight: number;
        score: number;
        min_height: number;
        feature_activation_bit_counts: number[] | null;
        validation?: string | null | undefined;
        first_block?: string | null | undefined;
        first_block_height?: number | null | undefined;
    } & {
        [k: string]: unknown;
    };
    success: true;
    tx: {
        raw: string;
        nonce: string;
        hash: string;
        tokens: {
            symbol: string | null;
            name: string | null;
            uid: string;
        }[];
        timestamp: number;
        version: number;
        weight: number;
        inputs: {
            index: number;
            value: bigint;
            script: string;
            token_data: number;
            decoded: {
                type: "P2PKH";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | {
                type: "MultiSig";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | z.objectOutputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">;
            tx_id: string;
            token?: string | null | undefined;
        }[];
        outputs: {
            value: bigint;
            script: string;
            token_data: number;
            decoded: {
                type: "P2PKH";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | {
                type: "MultiSig";
                address: string;
                value: bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | z.objectOutputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">;
            spent_by: string | null;
            token?: string | null | undefined;
        }[];
        parents: string[];
        signal_bits: number;
        token_name?: string | null | undefined;
        token_symbol?: string | null | undefined;
        nc_id?: string | null | undefined;
        nc_blueprint_id?: string | null | undefined;
        nc_method?: string | null | undefined;
        nc_args?: string | null | undefined;
        nc_pubkey?: string | null | undefined;
        nc_address?: string | null | undefined;
        nc_context?: z.objectOutputType<{
            actions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">>]>, "many">;
            address: z.ZodString;
            timestamp: z.ZodNumber;
        }, z.ZodTypeAny, "passthrough"> | null | undefined;
    } & {
        [k: string]: unknown;
    };
    spent_outputs: Record<number, string>;
}, {
    meta: {
        height: number;
        children: string[];
        hash: string;
        spent_outputs: [number, string[]][];
        received_by: string[];
        conflict_with: string[];
        voided_by: string[];
        twins: string[];
        accumulated_weight: number;
        score: number;
        min_height: number;
        feature_activation_bit_counts: number[] | null;
        validation?: string | null | undefined;
        first_block?: string | null | undefined;
        first_block_height?: number | null | undefined;
    } & {
        [k: string]: unknown;
    };
    success: true;
    tx: {
        raw: string;
        nonce: string;
        hash: string;
        tokens: {
            symbol: string | null;
            name: string | null;
            uid: string;
        }[];
        timestamp: number;
        version: number;
        weight: number;
        inputs: {
            index: number;
            value: string | number | bigint;
            script: string;
            token_data: number;
            decoded: {
                type: "P2PKH";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | {
                type: "MultiSig";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | z.objectInputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">;
            tx_id: string;
            token?: string | null | undefined;
        }[];
        outputs: {
            value: string | number | bigint;
            script: string;
            token_data: number;
            decoded: {
                type: "P2PKH";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | {
                type: "MultiSig";
                address: string;
                value: string | number | bigint;
                token_data: number;
                timelock?: number | null | undefined;
            } | z.objectInputType<{
                type: z.ZodUndefined;
            }, z.ZodTypeAny, "passthrough">;
            token?: string | null | undefined;
            spent_by?: string | null | undefined;
        }[];
        parents: string[];
        signal_bits: number;
        token_name?: string | null | undefined;
        token_symbol?: string | null | undefined;
        nc_id?: string | null | undefined;
        nc_blueprint_id?: string | null | undefined;
        nc_method?: string | null | undefined;
        nc_args?: string | null | undefined;
        nc_pubkey?: string | null | undefined;
        nc_address?: string | null | undefined;
        nc_context?: z.objectInputType<{
            actions: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"deposit">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }>, {
                type: z.ZodLiteral<"withdrawal">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"grant_authority">;
            }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
                token_uid: z.ZodString;
            }, {
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }>, {
                type: z.ZodLiteral<"acquire_authority">;
            }>, z.ZodTypeAny, "passthrough">>]>, "many">;
            address: z.ZodString;
            timestamp: z.ZodNumber;
        }, z.ZodTypeAny, "passthrough"> | null | undefined;
    } & {
        [k: string]: unknown;
    };
    spent_outputs: Record<number, string>;
}>, z.ZodObject<{
    success: z.ZodLiteral<false>;
    message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    success: false;
    message?: string | null | undefined;
}, {
    success: false;
    message?: string | null | undefined;
}>]>;
export type FullNodeTxApiResponse = z.infer<typeof transactionApiSchema>;
//# sourceMappingURL=txApi.d.ts.map