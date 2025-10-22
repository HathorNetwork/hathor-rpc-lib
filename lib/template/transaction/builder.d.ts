/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { z } from 'zod';
import { TxTemplateInstruction, TransactionTemplate } from './instructions';
declare const RawInputInsArgs: z.ZodObject<Omit<{
    type: z.ZodLiteral<"input/raw">;
    position: z.ZodDefault<z.ZodNumber>;
    index: z.ZodUnion<[z.ZodString, z.ZodPipeline<z.ZodUnion<[z.ZodNumber, z.ZodString]>, z.ZodNumber>]>;
    txId: z.ZodUnion<[z.ZodString, z.ZodString]>;
}, "type">, "strip", z.ZodTypeAny, {
    index: string | number;
    position: number;
    txId: string;
}, {
    index: string | number;
    txId: string;
    position?: number | undefined;
}>;
declare const UtxoSelectInsArgs: z.ZodObject<Omit<{
    type: z.ZodLiteral<"input/utxo">;
    position: z.ZodDefault<z.ZodNumber>;
    fill: z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodPipeline<z.ZodUnion<[z.ZodBigInt, z.ZodNumber, z.ZodString]>, z.ZodBigInt>, bigint, string | number | bigint>]>;
    token: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodString>]>;
    address: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    autoChange: z.ZodDefault<z.ZodBoolean>;
    changeAddress: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
}, "type">, "strip", z.ZodTypeAny, {
    fill: string | bigint;
    position: number;
    token: string;
    autoChange: boolean;
    address?: string | undefined;
    changeAddress?: string | undefined;
}, {
    fill: string | number | bigint;
    address?: string | undefined;
    position?: number | undefined;
    token?: string | undefined;
    changeAddress?: string | undefined;
    autoChange?: boolean | undefined;
}>;
declare const AuthoritySelectInsArgs: z.ZodObject<Omit<{
    type: z.ZodLiteral<"input/authority">;
    position: z.ZodDefault<z.ZodNumber>;
    authority: z.ZodEnum<["mint", "melt"]>;
    token: z.ZodUnion<[z.ZodString, z.ZodString]>;
    count: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodPipeline<z.ZodUnion<[z.ZodNumber, z.ZodString]>, z.ZodNumber>>]>;
    address: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
}, "type">, "strip", z.ZodTypeAny, {
    position: number;
    token: string;
    count: string | number;
    authority: "mint" | "melt";
    address?: string | undefined;
}, {
    token: string;
    authority: "mint" | "melt";
    address?: string | undefined;
    position?: number | undefined;
    count?: string | number | undefined;
}>;
declare const RawOutputInsArgs: z.ZodObject<Omit<{
    type: z.ZodLiteral<"output/raw">;
    position: z.ZodDefault<z.ZodNumber>;
    amount: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodEffects<z.ZodPipeline<z.ZodUnion<[z.ZodBigInt, z.ZodNumber, z.ZodString]>, z.ZodBigInt>, bigint, string | number | bigint>>]>;
    script: z.ZodUnion<[z.ZodString, z.ZodString]>;
    token: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodString>]>;
    timelock: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    authority: z.ZodOptional<z.ZodEnum<["mint", "melt"]>>;
    useCreatedToken: z.ZodDefault<z.ZodBoolean>;
}, "type">, "strip", z.ZodTypeAny, {
    position: number;
    script: string;
    token: string;
    useCreatedToken: boolean;
    timelock?: string | number | undefined;
    amount?: string | bigint | undefined;
    authority?: "mint" | "melt" | undefined;
}, {
    script: string;
    position?: number | undefined;
    timelock?: string | number | undefined;
    token?: string | undefined;
    amount?: string | number | bigint | undefined;
    authority?: "mint" | "melt" | undefined;
    useCreatedToken?: boolean | undefined;
}>;
declare const DataOutputInsArgs: z.ZodObject<Omit<{
    type: z.ZodLiteral<"output/data">;
    position: z.ZodDefault<z.ZodNumber>;
    data: z.ZodUnion<[z.ZodString, z.ZodString]>;
    token: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodString>]>;
    useCreatedToken: z.ZodDefault<z.ZodBoolean>;
}, "type">, "strip", z.ZodTypeAny, {
    data: string;
    position: number;
    token: string;
    useCreatedToken: boolean;
}, {
    data: string;
    position?: number | undefined;
    token?: string | undefined;
    useCreatedToken?: boolean | undefined;
}>;
declare const TokenOutputInsArgs: z.ZodObject<Omit<{
    type: z.ZodLiteral<"output/token">;
    position: z.ZodDefault<z.ZodNumber>;
    amount: z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodPipeline<z.ZodUnion<[z.ZodBigInt, z.ZodNumber, z.ZodString]>, z.ZodBigInt>, bigint, string | number | bigint>]>;
    token: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodString>]>;
    address: z.ZodUnion<[z.ZodString, z.ZodString]>;
    timelock: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    checkAddress: z.ZodOptional<z.ZodBoolean>;
    useCreatedToken: z.ZodDefault<z.ZodBoolean>;
}, "type">, "strip", z.ZodTypeAny, {
    address: string;
    position: number;
    token: string;
    amount: string | bigint;
    useCreatedToken: boolean;
    timelock?: string | number | undefined;
    checkAddress?: boolean | undefined;
}, {
    address: string;
    amount: string | number | bigint;
    position?: number | undefined;
    timelock?: string | number | undefined;
    token?: string | undefined;
    useCreatedToken?: boolean | undefined;
    checkAddress?: boolean | undefined;
}>;
declare const AuthorityOutputInsArgs: z.ZodObject<Omit<{
    type: z.ZodLiteral<"output/authority">;
    position: z.ZodDefault<z.ZodNumber>;
    count: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodPipeline<z.ZodUnion<[z.ZodNumber, z.ZodString]>, z.ZodNumber>>]>;
    token: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    authority: z.ZodEnum<["mint", "melt"]>;
    address: z.ZodUnion<[z.ZodString, z.ZodString]>;
    timelock: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    checkAddress: z.ZodOptional<z.ZodBoolean>;
    useCreatedToken: z.ZodDefault<z.ZodBoolean>;
}, "type">, "strip", z.ZodTypeAny, {
    address: string;
    position: number;
    count: string | number;
    authority: "mint" | "melt";
    useCreatedToken: boolean;
    timelock?: string | number | undefined;
    token?: string | undefined;
    checkAddress?: boolean | undefined;
}, {
    address: string;
    authority: "mint" | "melt";
    position?: number | undefined;
    timelock?: string | number | undefined;
    token?: string | undefined;
    count?: string | number | undefined;
    useCreatedToken?: boolean | undefined;
    checkAddress?: boolean | undefined;
}>;
declare const ShuffleInsArgs: z.ZodObject<Omit<{
    type: z.ZodLiteral<"action/shuffle">;
    target: z.ZodEnum<["inputs", "outputs", "all"]>;
}, "type">, "strip", z.ZodTypeAny, {
    target: "all" | "inputs" | "outputs";
}, {
    target: "all" | "inputs" | "outputs";
}>;
declare const CompleteTxInsArgs: z.ZodObject<Omit<{
    type: z.ZodLiteral<"action/complete">;
    token: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    address: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    changeAddress: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    timelock: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    skipSelection: z.ZodDefault<z.ZodBoolean>;
    skipChange: z.ZodDefault<z.ZodBoolean>;
    skipAuthorities: z.ZodDefault<z.ZodBoolean>;
    calculateFee: z.ZodDefault<z.ZodBoolean>;
}, "type">, "strip", z.ZodTypeAny, {
    skipAuthorities: boolean;
    skipSelection: boolean;
    skipChange: boolean;
    calculateFee: boolean;
    address?: string | undefined;
    timelock?: string | number | undefined;
    token?: string | undefined;
    changeAddress?: string | undefined;
}, {
    address?: string | undefined;
    timelock?: string | number | undefined;
    token?: string | undefined;
    changeAddress?: string | undefined;
    skipAuthorities?: boolean | undefined;
    skipSelection?: boolean | undefined;
    skipChange?: boolean | undefined;
    calculateFee?: boolean | undefined;
}>;
declare const ConfigInsArgs: z.ZodObject<Omit<{
    type: z.ZodLiteral<"action/config">;
    version: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    signalBits: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    createToken: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodBoolean>]>;
    tokenName: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    tokenSymbol: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
}, "type">, "strip", z.ZodTypeAny, {
    signalBits?: string | number | undefined;
    version?: string | number | undefined;
    tokenName?: string | undefined;
    tokenSymbol?: string | undefined;
    createToken?: string | boolean | undefined;
}, {
    signalBits?: string | number | undefined;
    version?: string | number | undefined;
    tokenName?: string | undefined;
    tokenSymbol?: string | undefined;
    createToken?: string | boolean | undefined;
}>;
declare const SetVarInsArgs: z.ZodObject<Omit<{
    type: z.ZodLiteral<"action/setvar">;
    name: z.ZodString;
    value: z.ZodOptional<z.ZodUnknown>;
    call: z.ZodOptional<z.ZodDiscriminatedUnion<"method", [z.ZodObject<{
        method: z.ZodLiteral<"get_wallet_address">;
        index: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        method: "get_wallet_address";
        index?: number | undefined;
    }, {
        method: "get_wallet_address";
        index?: number | undefined;
    }>, z.ZodObject<{
        method: z.ZodLiteral<"get_wallet_balance">;
        token: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodString>]>;
        authority: z.ZodOptional<z.ZodEnum<["mint", "melt"]>>;
    }, "strip", z.ZodTypeAny, {
        method: "get_wallet_balance";
        token: string;
        authority?: "mint" | "melt" | undefined;
    }, {
        method: "get_wallet_balance";
        token?: string | undefined;
        authority?: "mint" | "melt" | undefined;
    }>, z.ZodObject<{
        method: z.ZodLiteral<"get_oracle_script">;
        index: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        index: number;
        method: "get_oracle_script";
    }, {
        index: number;
        method: "get_oracle_script";
    }>, z.ZodObject<{
        method: z.ZodLiteral<"get_oracle_signed_data">;
        index: z.ZodNumber;
        type: z.ZodString;
        data: z.ZodUnion<[z.ZodString, z.ZodUnknown]>;
        ncId: z.ZodUnion<[z.ZodString, z.ZodString]>;
    }, "strip", z.ZodTypeAny, {
        index: number;
        type: string;
        method: "get_oracle_signed_data";
        ncId: string;
        data?: unknown;
    }, {
        index: number;
        type: string;
        method: "get_oracle_signed_data";
        ncId: string;
        data?: unknown;
    }>]>>;
}, "type">, "strip", z.ZodTypeAny, {
    name: string;
    value?: unknown;
    call?: {
        method: "get_wallet_address";
        index?: number | undefined;
    } | {
        index: number;
        method: "get_oracle_script";
    } | {
        index: number;
        type: string;
        method: "get_oracle_signed_data";
        ncId: string;
        data?: unknown;
    } | {
        method: "get_wallet_balance";
        token: string;
        authority?: "mint" | "melt" | undefined;
    } | undefined;
}, {
    name: string;
    value?: unknown;
    call?: {
        method: "get_wallet_address";
        index?: number | undefined;
    } | {
        index: number;
        method: "get_oracle_script";
    } | {
        index: number;
        type: string;
        method: "get_oracle_signed_data";
        ncId: string;
        data?: unknown;
    } | {
        method: "get_wallet_balance";
        token?: string | undefined;
        authority?: "mint" | "melt" | undefined;
    } | undefined;
}>;
declare const NanoMethodInsArgs: z.ZodObject<Omit<{
    type: z.ZodLiteral<"nano/execute">;
    id: z.ZodUnion<[z.ZodString, z.ZodString]>;
    method: z.ZodString;
    args: z.ZodDefault<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodUnknown]>, "many">>;
    caller: z.ZodUnion<[z.ZodString, z.ZodString]>;
    actions: z.ZodDefault<z.ZodArray<z.ZodUnion<[z.ZodObject<{
        action: z.ZodLiteral<"deposit">;
        token: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodString>]>;
        useCreatedToken: z.ZodDefault<z.ZodBoolean>;
        amount: z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodPipeline<z.ZodUnion<[z.ZodBigInt, z.ZodNumber, z.ZodString]>, z.ZodBigInt>, bigint, string | number | bigint>]>;
        address: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
        autoChange: z.ZodDefault<z.ZodBoolean>;
        changeAddress: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
        skipSelection: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        action: "deposit";
        token: string;
        amount: string | bigint;
        autoChange: boolean;
        useCreatedToken: boolean;
        skipSelection: boolean;
        address?: string | undefined;
        changeAddress?: string | undefined;
    }, {
        action: "deposit";
        amount: string | number | bigint;
        address?: string | undefined;
        token?: string | undefined;
        changeAddress?: string | undefined;
        autoChange?: boolean | undefined;
        useCreatedToken?: boolean | undefined;
        skipSelection?: boolean | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"withdrawal">;
        token: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodString>]>;
        amount: z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodPipeline<z.ZodUnion<[z.ZodBigInt, z.ZodNumber, z.ZodString]>, z.ZodBigInt>, bigint, string | number | bigint>]>;
        address: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
        skipOutputs: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        action: "withdrawal";
        token: string;
        amount: string | bigint;
        skipOutputs: boolean;
        address?: string | undefined;
    }, {
        action: "withdrawal";
        amount: string | number | bigint;
        address?: string | undefined;
        token?: string | undefined;
        skipOutputs?: boolean | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"grant_authority">;
        token: z.ZodUnion<[z.ZodString, z.ZodString]>;
        useCreatedToken: z.ZodDefault<z.ZodBoolean>;
        authority: z.ZodEnum<["mint", "melt"]>;
        address: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
        createAnotherTo: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
        skipSelection: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        action: "grant_authority";
        token: string;
        authority: "mint" | "melt";
        useCreatedToken: boolean;
        skipSelection: boolean;
        address?: string | undefined;
        createAnotherTo?: string | undefined;
    }, {
        action: "grant_authority";
        token: string;
        authority: "mint" | "melt";
        address?: string | undefined;
        useCreatedToken?: boolean | undefined;
        skipSelection?: boolean | undefined;
        createAnotherTo?: string | undefined;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"acquire_authority">;
        token: z.ZodUnion<[z.ZodString, z.ZodString]>;
        authority: z.ZodEnum<["mint", "melt"]>;
        address: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
        skipOutputs: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        action: "acquire_authority";
        token: string;
        authority: "mint" | "melt";
        skipOutputs: boolean;
        address?: string | undefined;
    }, {
        action: "acquire_authority";
        token: string;
        authority: "mint" | "melt";
        address?: string | undefined;
        skipOutputs?: boolean | undefined;
    }>]>, "many">>;
}, "type">, "strip", z.ZodTypeAny, {
    id: string;
    method: string;
    args: unknown[];
    actions: ({
        action: "deposit";
        token: string;
        amount: string | bigint;
        autoChange: boolean;
        useCreatedToken: boolean;
        skipSelection: boolean;
        address?: string | undefined;
        changeAddress?: string | undefined;
    } | {
        action: "withdrawal";
        token: string;
        amount: string | bigint;
        skipOutputs: boolean;
        address?: string | undefined;
    } | {
        action: "grant_authority";
        token: string;
        authority: "mint" | "melt";
        useCreatedToken: boolean;
        skipSelection: boolean;
        address?: string | undefined;
        createAnotherTo?: string | undefined;
    } | {
        action: "acquire_authority";
        token: string;
        authority: "mint" | "melt";
        skipOutputs: boolean;
        address?: string | undefined;
    })[];
    caller: string;
}, {
    id: string;
    method: string;
    caller: string;
    args?: unknown[] | undefined;
    actions?: ({
        action: "deposit";
        amount: string | number | bigint;
        address?: string | undefined;
        token?: string | undefined;
        changeAddress?: string | undefined;
        autoChange?: boolean | undefined;
        useCreatedToken?: boolean | undefined;
        skipSelection?: boolean | undefined;
    } | {
        action: "withdrawal";
        amount: string | number | bigint;
        address?: string | undefined;
        token?: string | undefined;
        skipOutputs?: boolean | undefined;
    } | {
        action: "grant_authority";
        token: string;
        authority: "mint" | "melt";
        address?: string | undefined;
        useCreatedToken?: boolean | undefined;
        skipSelection?: boolean | undefined;
        createAnotherTo?: string | undefined;
    } | {
        action: "acquire_authority";
        token: string;
        authority: "mint" | "melt";
        address?: string | undefined;
        skipOutputs?: boolean | undefined;
    })[] | undefined;
}>;
export declare class TransactionTemplateBuilder {
    template: z.infer<typeof TransactionTemplate>;
    constructor();
    static new(): TransactionTemplateBuilder;
    static from(instructions: z.input<typeof TransactionTemplate>): TransactionTemplateBuilder;
    build(): z.infer<typeof TransactionTemplate>;
    export(space?: number): string;
    addInstruction(ins: z.input<typeof TxTemplateInstruction>): TransactionTemplateBuilder;
    addRawInput(ins: z.input<typeof RawInputInsArgs>): this;
    addUtxoSelect(ins: z.input<typeof UtxoSelectInsArgs>): this;
    addAuthoritySelect(ins: z.input<typeof AuthoritySelectInsArgs>): this;
    addRawOutput(ins: z.input<typeof RawOutputInsArgs>): this;
    addDataOutput(ins: z.input<typeof DataOutputInsArgs>): this;
    addTokenOutput(ins: z.input<typeof TokenOutputInsArgs>): this;
    addAuthorityOutput(ins: z.input<typeof AuthorityOutputInsArgs>): this;
    addShuffleAction(ins: z.input<typeof ShuffleInsArgs>): this;
    addCompleteAction(ins: z.input<typeof CompleteTxInsArgs>): this;
    addConfigAction(ins: z.input<typeof ConfigInsArgs>): this;
    addSetVarAction(ins: z.input<typeof SetVarInsArgs>): this;
    addNanoMethodExecution(ins: z.input<typeof NanoMethodInsArgs>): this;
}
export {};
//# sourceMappingURL=builder.d.ts.map