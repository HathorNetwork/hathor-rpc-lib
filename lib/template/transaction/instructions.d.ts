/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { z } from 'zod';
export declare const TemplateRef: z.ZodString;
/**
 * If the key matches a template reference (i.e. `{name}`) it returns the variable of that name.
 * If not the ref should be the actual value.
 * This is validated by the `schema` argument which is a ZodType that parses either:
 *   - A `TemplateRef` or;
 *   - A ZodType that outputs `S`;
 *
 * The generic system allows with just the first argument a validation that the
 * schema will parse to the expected type and that `ref` is `string | S`.
 * This way changes on validation affect the executors and the value from vars
 * will be of the expected type.
 * The goal of this system is to avoid too much verbosity while keeping strong cohesive typing.
 *
 * @example
 * ```
 * const TokenSchema = TemplateRef.or(z.string().regex(/^[A-F0-9]{64}&1/));
 * const AmountSchema = TemplateRef.or(z.bigint());
 * const IndexSchema = TemplateRef.or(z.number().min(0));
 *
 * const token: string = getVariable<string>(ref1, {foo: 'bar'}, TokenSchema);
 * const amount: bigint = getVariable<bigint>(ref2, {foo: 10n}, AmountSchema);
 * const token: string = getVariable<number>(ref3, {foo: 27}, IndexSchema);
 * ```
 */
export declare function getVariable<S, T extends z.ZodUnion<[typeof TemplateRef, z.ZodType<S, z.ZodTypeDef, unknown>]> = z.ZodUnion<[
    typeof TemplateRef,
    z.ZodType<S, z.ZodTypeDef, unknown>
]>>(ref: z.infer<T>, vars: Record<string, unknown>, schema: T): S;
export declare const Sha256HexSchema: z.ZodString;
export declare const TxIdSchema: z.ZodString;
export declare const CustomTokenSchema: z.ZodString;
export declare const TokenSchema: z.ZodString;
export declare const AddressSchema: z.ZodString;
/**
 * This schema is necessary because `z.coerce.bigint().optional()` throws
 * with `undefined` input due to how coerce works (this happens even with safeParse)
 * so we need a custom bigint that can receive number or string as input and be optional.
 * */
export declare const AmountSchema: z.ZodEffects<z.ZodPipeline<z.ZodUnion<[z.ZodBigInt, z.ZodNumber, z.ZodString]>, z.ZodBigInt>, bigint, string | number | bigint>;
export declare const CountSchema: z.ZodPipeline<z.ZodUnion<[z.ZodNumber, z.ZodString]>, z.ZodNumber>;
export declare const TxIndexSchema: z.ZodPipeline<z.ZodUnion<[z.ZodNumber, z.ZodString]>, z.ZodNumber>;
export declare const RawInputInstruction: z.ZodObject<{
    type: z.ZodLiteral<"input/raw">;
    position: z.ZodDefault<z.ZodNumber>;
    index: z.ZodUnion<[z.ZodString, z.ZodPipeline<z.ZodUnion<[z.ZodNumber, z.ZodString]>, z.ZodNumber>]>;
    txId: z.ZodUnion<[z.ZodString, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    index: string | number;
    type: "input/raw";
    position: number;
    txId: string;
}, {
    index: string | number;
    type: "input/raw";
    txId: string;
    position?: number | undefined;
}>;
export declare const UtxoSelectInstruction: z.ZodObject<{
    type: z.ZodLiteral<"input/utxo">;
    position: z.ZodDefault<z.ZodNumber>;
    fill: z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodPipeline<z.ZodUnion<[z.ZodBigInt, z.ZodNumber, z.ZodString]>, z.ZodBigInt>, bigint, string | number | bigint>]>;
    token: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodString>]>;
    address: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    autoChange: z.ZodDefault<z.ZodBoolean>;
    changeAddress: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
}, "strip", z.ZodTypeAny, {
    fill: string | bigint;
    type: "input/utxo";
    position: number;
    token: string;
    autoChange: boolean;
    address?: string | undefined;
    changeAddress?: string | undefined;
}, {
    fill: string | number | bigint;
    type: "input/utxo";
    address?: string | undefined;
    position?: number | undefined;
    token?: string | undefined;
    changeAddress?: string | undefined;
    autoChange?: boolean | undefined;
}>;
export declare const AuthoritySelectInstruction: z.ZodObject<{
    type: z.ZodLiteral<"input/authority">;
    position: z.ZodDefault<z.ZodNumber>;
    authority: z.ZodEnum<["mint", "melt"]>;
    token: z.ZodUnion<[z.ZodString, z.ZodString]>;
    count: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodPipeline<z.ZodUnion<[z.ZodNumber, z.ZodString]>, z.ZodNumber>>]>;
    address: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
}, "strip", z.ZodTypeAny, {
    type: "input/authority";
    position: number;
    token: string;
    count: string | number;
    authority: "mint" | "melt";
    address?: string | undefined;
}, {
    type: "input/authority";
    token: string;
    authority: "mint" | "melt";
    address?: string | undefined;
    position?: number | undefined;
    count?: string | number | undefined;
}>;
export declare const RawOutputInstruction: z.ZodObject<{
    type: z.ZodLiteral<"output/raw">;
    position: z.ZodDefault<z.ZodNumber>;
    amount: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodEffects<z.ZodPipeline<z.ZodUnion<[z.ZodBigInt, z.ZodNumber, z.ZodString]>, z.ZodBigInt>, bigint, string | number | bigint>>]>;
    script: z.ZodUnion<[z.ZodString, z.ZodString]>;
    token: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodString>]>;
    timelock: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    authority: z.ZodOptional<z.ZodEnum<["mint", "melt"]>>;
    useCreatedToken: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "output/raw";
    position: number;
    script: string;
    token: string;
    useCreatedToken: boolean;
    timelock?: string | number | undefined;
    amount?: string | bigint | undefined;
    authority?: "mint" | "melt" | undefined;
}, {
    type: "output/raw";
    script: string;
    position?: number | undefined;
    timelock?: string | number | undefined;
    token?: string | undefined;
    amount?: string | number | bigint | undefined;
    authority?: "mint" | "melt" | undefined;
    useCreatedToken?: boolean | undefined;
}>;
export declare const TokenOutputInstruction: z.ZodObject<{
    type: z.ZodLiteral<"output/token">;
    position: z.ZodDefault<z.ZodNumber>;
    amount: z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodPipeline<z.ZodUnion<[z.ZodBigInt, z.ZodNumber, z.ZodString]>, z.ZodBigInt>, bigint, string | number | bigint>]>;
    token: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodString>]>;
    address: z.ZodUnion<[z.ZodString, z.ZodString]>;
    timelock: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    checkAddress: z.ZodOptional<z.ZodBoolean>;
    useCreatedToken: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "output/token";
    address: string;
    position: number;
    token: string;
    amount: string | bigint;
    useCreatedToken: boolean;
    timelock?: string | number | undefined;
    checkAddress?: boolean | undefined;
}, {
    type: "output/token";
    address: string;
    amount: string | number | bigint;
    position?: number | undefined;
    timelock?: string | number | undefined;
    token?: string | undefined;
    useCreatedToken?: boolean | undefined;
    checkAddress?: boolean | undefined;
}>;
export declare const AuthorityOutputInstruction: z.ZodObject<{
    type: z.ZodLiteral<"output/authority">;
    position: z.ZodDefault<z.ZodNumber>;
    count: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodPipeline<z.ZodUnion<[z.ZodNumber, z.ZodString]>, z.ZodNumber>>]>;
    token: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    authority: z.ZodEnum<["mint", "melt"]>;
    address: z.ZodUnion<[z.ZodString, z.ZodString]>;
    timelock: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    checkAddress: z.ZodOptional<z.ZodBoolean>;
    useCreatedToken: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "output/authority";
    address: string;
    position: number;
    count: string | number;
    authority: "mint" | "melt";
    useCreatedToken: boolean;
    timelock?: string | number | undefined;
    token?: string | undefined;
    checkAddress?: boolean | undefined;
}, {
    type: "output/authority";
    address: string;
    authority: "mint" | "melt";
    position?: number | undefined;
    timelock?: string | number | undefined;
    token?: string | undefined;
    count?: string | number | undefined;
    useCreatedToken?: boolean | undefined;
    checkAddress?: boolean | undefined;
}>;
export declare const DataOutputInstruction: z.ZodObject<{
    type: z.ZodLiteral<"output/data">;
    position: z.ZodDefault<z.ZodNumber>;
    data: z.ZodUnion<[z.ZodString, z.ZodString]>;
    token: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodString>]>;
    useCreatedToken: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "output/data";
    data: string;
    position: number;
    token: string;
    useCreatedToken: boolean;
}, {
    type: "output/data";
    data: string;
    position?: number | undefined;
    token?: string | undefined;
    useCreatedToken?: boolean | undefined;
}>;
export declare const ShuffleInstruction: z.ZodObject<{
    type: z.ZodLiteral<"action/shuffle">;
    target: z.ZodEnum<["inputs", "outputs", "all"]>;
}, "strip", z.ZodTypeAny, {
    type: "action/shuffle";
    target: "all" | "inputs" | "outputs";
}, {
    type: "action/shuffle";
    target: "all" | "inputs" | "outputs";
}>;
export declare const CompleteTxInstruction: z.ZodObject<{
    type: z.ZodLiteral<"action/complete">;
    token: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    address: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    changeAddress: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    timelock: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    skipSelection: z.ZodDefault<z.ZodBoolean>;
    skipChange: z.ZodDefault<z.ZodBoolean>;
    skipAuthorities: z.ZodDefault<z.ZodBoolean>;
    calculateFee: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "action/complete";
    skipAuthorities: boolean;
    skipSelection: boolean;
    skipChange: boolean;
    calculateFee: boolean;
    address?: string | undefined;
    timelock?: string | number | undefined;
    token?: string | undefined;
    changeAddress?: string | undefined;
}, {
    type: "action/complete";
    address?: string | undefined;
    timelock?: string | number | undefined;
    token?: string | undefined;
    changeAddress?: string | undefined;
    skipAuthorities?: boolean | undefined;
    skipSelection?: boolean | undefined;
    skipChange?: boolean | undefined;
    calculateFee?: boolean | undefined;
}>;
export declare const ConfigInstruction: z.ZodObject<{
    type: z.ZodLiteral<"action/config">;
    version: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    signalBits: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    createToken: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodBoolean>]>;
    tokenName: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    tokenSymbol: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
}, "strip", z.ZodTypeAny, {
    type: "action/config";
    signalBits?: string | number | undefined;
    version?: string | number | undefined;
    tokenName?: string | undefined;
    tokenSymbol?: string | undefined;
    createToken?: string | boolean | undefined;
}, {
    type: "action/config";
    signalBits?: string | number | undefined;
    version?: string | number | undefined;
    tokenName?: string | undefined;
    tokenSymbol?: string | undefined;
    createToken?: string | boolean | undefined;
}>;
export declare const SetVarGetWalletAddressOpts: z.ZodObject<{
    method: z.ZodLiteral<"get_wallet_address">;
    index: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    method: "get_wallet_address";
    index?: number | undefined;
}, {
    method: "get_wallet_address";
    index?: number | undefined;
}>;
export declare const SetVarGetOracleScriptOpts: z.ZodObject<{
    method: z.ZodLiteral<"get_oracle_script">;
    index: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    index: number;
    method: "get_oracle_script";
}, {
    index: number;
    method: "get_oracle_script";
}>;
export declare const SetVarGetOracleSignedDataOpts: z.ZodObject<{
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
}>;
export declare const SetVarGetWalletBalanceOpts: z.ZodObject<{
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
}>;
export declare const SetVarCallArgs: z.ZodDiscriminatedUnion<"method", [z.ZodObject<{
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
}>]>;
export declare const SetVarInstruction: z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
    type: "action/setvar";
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
    type: "action/setvar";
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
export declare const NanoDepositAction: z.ZodObject<{
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
}>;
export declare const NanoWithdrawalAction: z.ZodObject<{
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
}>;
export declare const NanoGrantAuthorityAction: z.ZodObject<{
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
}>;
export declare const NanoAcquireAuthorityAction: z.ZodObject<{
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
}>;
export declare const NanoAction: z.ZodUnion<[z.ZodObject<{
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
}>]>;
export declare const NanoMethodInstruction: z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
    type: "nano/execute";
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
    type: "nano/execute";
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
export declare const TxTemplateInstruction: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"input/raw">;
    position: z.ZodDefault<z.ZodNumber>;
    index: z.ZodUnion<[z.ZodString, z.ZodPipeline<z.ZodUnion<[z.ZodNumber, z.ZodString]>, z.ZodNumber>]>;
    txId: z.ZodUnion<[z.ZodString, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    index: string | number;
    type: "input/raw";
    position: number;
    txId: string;
}, {
    index: string | number;
    type: "input/raw";
    txId: string;
    position?: number | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"input/utxo">;
    position: z.ZodDefault<z.ZodNumber>;
    fill: z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodPipeline<z.ZodUnion<[z.ZodBigInt, z.ZodNumber, z.ZodString]>, z.ZodBigInt>, bigint, string | number | bigint>]>;
    token: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodString>]>;
    address: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    autoChange: z.ZodDefault<z.ZodBoolean>;
    changeAddress: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
}, "strip", z.ZodTypeAny, {
    fill: string | bigint;
    type: "input/utxo";
    position: number;
    token: string;
    autoChange: boolean;
    address?: string | undefined;
    changeAddress?: string | undefined;
}, {
    fill: string | number | bigint;
    type: "input/utxo";
    address?: string | undefined;
    position?: number | undefined;
    token?: string | undefined;
    changeAddress?: string | undefined;
    autoChange?: boolean | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"input/authority">;
    position: z.ZodDefault<z.ZodNumber>;
    authority: z.ZodEnum<["mint", "melt"]>;
    token: z.ZodUnion<[z.ZodString, z.ZodString]>;
    count: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodPipeline<z.ZodUnion<[z.ZodNumber, z.ZodString]>, z.ZodNumber>>]>;
    address: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
}, "strip", z.ZodTypeAny, {
    type: "input/authority";
    position: number;
    token: string;
    count: string | number;
    authority: "mint" | "melt";
    address?: string | undefined;
}, {
    type: "input/authority";
    token: string;
    authority: "mint" | "melt";
    address?: string | undefined;
    position?: number | undefined;
    count?: string | number | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"output/raw">;
    position: z.ZodDefault<z.ZodNumber>;
    amount: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodEffects<z.ZodPipeline<z.ZodUnion<[z.ZodBigInt, z.ZodNumber, z.ZodString]>, z.ZodBigInt>, bigint, string | number | bigint>>]>;
    script: z.ZodUnion<[z.ZodString, z.ZodString]>;
    token: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodString>]>;
    timelock: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    authority: z.ZodOptional<z.ZodEnum<["mint", "melt"]>>;
    useCreatedToken: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "output/raw";
    position: number;
    script: string;
    token: string;
    useCreatedToken: boolean;
    timelock?: string | number | undefined;
    amount?: string | bigint | undefined;
    authority?: "mint" | "melt" | undefined;
}, {
    type: "output/raw";
    script: string;
    position?: number | undefined;
    timelock?: string | number | undefined;
    token?: string | undefined;
    amount?: string | number | bigint | undefined;
    authority?: "mint" | "melt" | undefined;
    useCreatedToken?: boolean | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"output/data">;
    position: z.ZodDefault<z.ZodNumber>;
    data: z.ZodUnion<[z.ZodString, z.ZodString]>;
    token: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodString>]>;
    useCreatedToken: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "output/data";
    data: string;
    position: number;
    token: string;
    useCreatedToken: boolean;
}, {
    type: "output/data";
    data: string;
    position?: number | undefined;
    token?: string | undefined;
    useCreatedToken?: boolean | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"output/token">;
    position: z.ZodDefault<z.ZodNumber>;
    amount: z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodPipeline<z.ZodUnion<[z.ZodBigInt, z.ZodNumber, z.ZodString]>, z.ZodBigInt>, bigint, string | number | bigint>]>;
    token: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodString>]>;
    address: z.ZodUnion<[z.ZodString, z.ZodString]>;
    timelock: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    checkAddress: z.ZodOptional<z.ZodBoolean>;
    useCreatedToken: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "output/token";
    address: string;
    position: number;
    token: string;
    amount: string | bigint;
    useCreatedToken: boolean;
    timelock?: string | number | undefined;
    checkAddress?: boolean | undefined;
}, {
    type: "output/token";
    address: string;
    amount: string | number | bigint;
    position?: number | undefined;
    timelock?: string | number | undefined;
    token?: string | undefined;
    useCreatedToken?: boolean | undefined;
    checkAddress?: boolean | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"output/authority">;
    position: z.ZodDefault<z.ZodNumber>;
    count: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodPipeline<z.ZodUnion<[z.ZodNumber, z.ZodString]>, z.ZodNumber>>]>;
    token: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    authority: z.ZodEnum<["mint", "melt"]>;
    address: z.ZodUnion<[z.ZodString, z.ZodString]>;
    timelock: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    checkAddress: z.ZodOptional<z.ZodBoolean>;
    useCreatedToken: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "output/authority";
    address: string;
    position: number;
    count: string | number;
    authority: "mint" | "melt";
    useCreatedToken: boolean;
    timelock?: string | number | undefined;
    token?: string | undefined;
    checkAddress?: boolean | undefined;
}, {
    type: "output/authority";
    address: string;
    authority: "mint" | "melt";
    position?: number | undefined;
    timelock?: string | number | undefined;
    token?: string | undefined;
    count?: string | number | undefined;
    useCreatedToken?: boolean | undefined;
    checkAddress?: boolean | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"action/shuffle">;
    target: z.ZodEnum<["inputs", "outputs", "all"]>;
}, "strip", z.ZodTypeAny, {
    type: "action/shuffle";
    target: "all" | "inputs" | "outputs";
}, {
    type: "action/shuffle";
    target: "all" | "inputs" | "outputs";
}>, z.ZodObject<{
    type: z.ZodLiteral<"action/complete">;
    token: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    address: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    changeAddress: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    timelock: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    skipSelection: z.ZodDefault<z.ZodBoolean>;
    skipChange: z.ZodDefault<z.ZodBoolean>;
    skipAuthorities: z.ZodDefault<z.ZodBoolean>;
    calculateFee: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "action/complete";
    skipAuthorities: boolean;
    skipSelection: boolean;
    skipChange: boolean;
    calculateFee: boolean;
    address?: string | undefined;
    timelock?: string | number | undefined;
    token?: string | undefined;
    changeAddress?: string | undefined;
}, {
    type: "action/complete";
    address?: string | undefined;
    timelock?: string | number | undefined;
    token?: string | undefined;
    changeAddress?: string | undefined;
    skipAuthorities?: boolean | undefined;
    skipSelection?: boolean | undefined;
    skipChange?: boolean | undefined;
    calculateFee?: boolean | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"action/config">;
    version: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    signalBits: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    createToken: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodBoolean>]>;
    tokenName: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    tokenSymbol: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
}, "strip", z.ZodTypeAny, {
    type: "action/config";
    signalBits?: string | number | undefined;
    version?: string | number | undefined;
    tokenName?: string | undefined;
    tokenSymbol?: string | undefined;
    createToken?: string | boolean | undefined;
}, {
    type: "action/config";
    signalBits?: string | number | undefined;
    version?: string | number | undefined;
    tokenName?: string | undefined;
    tokenSymbol?: string | undefined;
    createToken?: string | boolean | undefined;
}>, z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
    type: "action/setvar";
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
    type: "action/setvar";
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
}>, z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
    type: "nano/execute";
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
    type: "nano/execute";
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
}>]>;
export declare const TransactionTemplate: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"input/raw">;
    position: z.ZodDefault<z.ZodNumber>;
    index: z.ZodUnion<[z.ZodString, z.ZodPipeline<z.ZodUnion<[z.ZodNumber, z.ZodString]>, z.ZodNumber>]>;
    txId: z.ZodUnion<[z.ZodString, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    index: string | number;
    type: "input/raw";
    position: number;
    txId: string;
}, {
    index: string | number;
    type: "input/raw";
    txId: string;
    position?: number | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"input/utxo">;
    position: z.ZodDefault<z.ZodNumber>;
    fill: z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodPipeline<z.ZodUnion<[z.ZodBigInt, z.ZodNumber, z.ZodString]>, z.ZodBigInt>, bigint, string | number | bigint>]>;
    token: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodString>]>;
    address: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    autoChange: z.ZodDefault<z.ZodBoolean>;
    changeAddress: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
}, "strip", z.ZodTypeAny, {
    fill: string | bigint;
    type: "input/utxo";
    position: number;
    token: string;
    autoChange: boolean;
    address?: string | undefined;
    changeAddress?: string | undefined;
}, {
    fill: string | number | bigint;
    type: "input/utxo";
    address?: string | undefined;
    position?: number | undefined;
    token?: string | undefined;
    changeAddress?: string | undefined;
    autoChange?: boolean | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"input/authority">;
    position: z.ZodDefault<z.ZodNumber>;
    authority: z.ZodEnum<["mint", "melt"]>;
    token: z.ZodUnion<[z.ZodString, z.ZodString]>;
    count: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodPipeline<z.ZodUnion<[z.ZodNumber, z.ZodString]>, z.ZodNumber>>]>;
    address: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
}, "strip", z.ZodTypeAny, {
    type: "input/authority";
    position: number;
    token: string;
    count: string | number;
    authority: "mint" | "melt";
    address?: string | undefined;
}, {
    type: "input/authority";
    token: string;
    authority: "mint" | "melt";
    address?: string | undefined;
    position?: number | undefined;
    count?: string | number | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"output/raw">;
    position: z.ZodDefault<z.ZodNumber>;
    amount: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodEffects<z.ZodPipeline<z.ZodUnion<[z.ZodBigInt, z.ZodNumber, z.ZodString]>, z.ZodBigInt>, bigint, string | number | bigint>>]>;
    script: z.ZodUnion<[z.ZodString, z.ZodString]>;
    token: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodString>]>;
    timelock: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    authority: z.ZodOptional<z.ZodEnum<["mint", "melt"]>>;
    useCreatedToken: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "output/raw";
    position: number;
    script: string;
    token: string;
    useCreatedToken: boolean;
    timelock?: string | number | undefined;
    amount?: string | bigint | undefined;
    authority?: "mint" | "melt" | undefined;
}, {
    type: "output/raw";
    script: string;
    position?: number | undefined;
    timelock?: string | number | undefined;
    token?: string | undefined;
    amount?: string | number | bigint | undefined;
    authority?: "mint" | "melt" | undefined;
    useCreatedToken?: boolean | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"output/data">;
    position: z.ZodDefault<z.ZodNumber>;
    data: z.ZodUnion<[z.ZodString, z.ZodString]>;
    token: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodString>]>;
    useCreatedToken: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "output/data";
    data: string;
    position: number;
    token: string;
    useCreatedToken: boolean;
}, {
    type: "output/data";
    data: string;
    position?: number | undefined;
    token?: string | undefined;
    useCreatedToken?: boolean | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"output/token">;
    position: z.ZodDefault<z.ZodNumber>;
    amount: z.ZodUnion<[z.ZodString, z.ZodEffects<z.ZodPipeline<z.ZodUnion<[z.ZodBigInt, z.ZodNumber, z.ZodString]>, z.ZodBigInt>, bigint, string | number | bigint>]>;
    token: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodString>]>;
    address: z.ZodUnion<[z.ZodString, z.ZodString]>;
    timelock: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    checkAddress: z.ZodOptional<z.ZodBoolean>;
    useCreatedToken: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "output/token";
    address: string;
    position: number;
    token: string;
    amount: string | bigint;
    useCreatedToken: boolean;
    timelock?: string | number | undefined;
    checkAddress?: boolean | undefined;
}, {
    type: "output/token";
    address: string;
    amount: string | number | bigint;
    position?: number | undefined;
    timelock?: string | number | undefined;
    token?: string | undefined;
    useCreatedToken?: boolean | undefined;
    checkAddress?: boolean | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"output/authority">;
    position: z.ZodDefault<z.ZodNumber>;
    count: z.ZodUnion<[z.ZodString, z.ZodDefault<z.ZodPipeline<z.ZodUnion<[z.ZodNumber, z.ZodString]>, z.ZodNumber>>]>;
    token: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    authority: z.ZodEnum<["mint", "melt"]>;
    address: z.ZodUnion<[z.ZodString, z.ZodString]>;
    timelock: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    checkAddress: z.ZodOptional<z.ZodBoolean>;
    useCreatedToken: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "output/authority";
    address: string;
    position: number;
    count: string | number;
    authority: "mint" | "melt";
    useCreatedToken: boolean;
    timelock?: string | number | undefined;
    token?: string | undefined;
    checkAddress?: boolean | undefined;
}, {
    type: "output/authority";
    address: string;
    authority: "mint" | "melt";
    position?: number | undefined;
    timelock?: string | number | undefined;
    token?: string | undefined;
    count?: string | number | undefined;
    useCreatedToken?: boolean | undefined;
    checkAddress?: boolean | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"action/shuffle">;
    target: z.ZodEnum<["inputs", "outputs", "all"]>;
}, "strip", z.ZodTypeAny, {
    type: "action/shuffle";
    target: "all" | "inputs" | "outputs";
}, {
    type: "action/shuffle";
    target: "all" | "inputs" | "outputs";
}>, z.ZodObject<{
    type: z.ZodLiteral<"action/complete">;
    token: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    address: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    changeAddress: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    timelock: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    skipSelection: z.ZodDefault<z.ZodBoolean>;
    skipChange: z.ZodDefault<z.ZodBoolean>;
    skipAuthorities: z.ZodDefault<z.ZodBoolean>;
    calculateFee: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "action/complete";
    skipAuthorities: boolean;
    skipSelection: boolean;
    skipChange: boolean;
    calculateFee: boolean;
    address?: string | undefined;
    timelock?: string | number | undefined;
    token?: string | undefined;
    changeAddress?: string | undefined;
}, {
    type: "action/complete";
    address?: string | undefined;
    timelock?: string | number | undefined;
    token?: string | undefined;
    changeAddress?: string | undefined;
    skipAuthorities?: boolean | undefined;
    skipSelection?: boolean | undefined;
    skipChange?: boolean | undefined;
    calculateFee?: boolean | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"action/config">;
    version: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    signalBits: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodNumber>]>;
    createToken: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodBoolean>]>;
    tokenName: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    tokenSymbol: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
}, "strip", z.ZodTypeAny, {
    type: "action/config";
    signalBits?: string | number | undefined;
    version?: string | number | undefined;
    tokenName?: string | undefined;
    tokenSymbol?: string | undefined;
    createToken?: string | boolean | undefined;
}, {
    type: "action/config";
    signalBits?: string | number | undefined;
    version?: string | number | undefined;
    tokenName?: string | undefined;
    tokenSymbol?: string | undefined;
    createToken?: string | boolean | undefined;
}>, z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
    type: "action/setvar";
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
    type: "action/setvar";
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
}>, z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
    type: "nano/execute";
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
    type: "nano/execute";
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
}>]>, "many">;
//# sourceMappingURL=instructions.d.ts.map