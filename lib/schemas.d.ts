/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { z } from 'zod';
import { IAddressMetadataAsRecord, IAuthoritiesBalance, IBalance, IHistoryInput, IHistoryOutput, IHistoryOutputDecoded, IHistoryTx, ILockedUtxo, ITokenBalance, ITokenMetadata, IUtxo } from './types';
import { ZodSchema } from './utils/bigint';
/**
 * TxId schema
 */
export declare const txIdSchema: z.ZodString;
export declare const ITokenBalanceSchema: ZodSchema<ITokenBalance>;
export declare const IAuthoritiesBalanceSchema: ZodSchema<IAuthoritiesBalance>;
export declare const IBalanceSchema: ZodSchema<IBalance>;
export declare const IAddressMetadataAsRecordSchema: ZodSchema<IAddressMetadataAsRecord>;
export declare const ITokenMetadataSchema: ZodSchema<ITokenMetadata>;
export declare const IHistoryOutputDecodedSchema: ZodSchema<IHistoryOutputDecoded>;
export declare const IHistoryInputSchema: ZodSchema<IHistoryInput>;
export declare const IHistoryOutputSchema: ZodSchema<IHistoryOutput>;
export declare const IHistoryNanoContractBaseAction: z.ZodObject<{
    token_uid: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token_uid: string;
}, {
    token_uid: string;
}>;
export declare const IHistoryNanoContractBaseTokenAction: z.ZodObject<z.objectUtil.extendShape<{
    token_uid: z.ZodString;
}, {
    amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
}>, "strip", z.ZodTypeAny, {
    token_uid: string;
    amount: bigint;
}, {
    token_uid: string;
    amount: string | number | bigint;
}>;
export declare const IHistoryNanoContractBaseAuthorityAction: z.ZodObject<z.objectUtil.extendShape<{
    token_uid: z.ZodString;
}, {
    mint: z.ZodBoolean;
    melt: z.ZodBoolean;
}>, "strip", z.ZodTypeAny, {
    mint: boolean;
    melt: boolean;
    token_uid: string;
}, {
    mint: boolean;
    melt: boolean;
    token_uid: string;
}>;
export declare const IHistoryNanoContractActionWithdrawalSchema: z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
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
}>, z.ZodTypeAny, "passthrough">>;
export declare const IHistoryNanoContractActionDepositSchema: z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
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
}>, z.ZodTypeAny, "passthrough">>;
export declare const IHistoryNanoContractActionGrantAuthoritySchema: z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
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
}>, z.ZodTypeAny, "passthrough">>;
export declare const IHistoryNanoContractActionAcquireAuthoritySchema: z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
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
}>, z.ZodTypeAny, "passthrough">>;
export declare const IHistoryNanoContractActionSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
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
}>, z.ZodTypeAny, "passthrough">>]>;
export declare const IHistoryNanoContractContextSchema: z.ZodObject<{
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
}, z.ZodTypeAny, "passthrough">>;
export declare const IHistoryTxSchema: ZodSchema<IHistoryTx>;
export declare const IUtxoSchema: ZodSchema<IUtxo>;
export declare const ILockedUtxoSchema: ZodSchema<ILockedUtxo>;
//# sourceMappingURL=schemas.d.ts.map