/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { z } from 'zod';
import { IHistoryTx, OutputValueType } from '../types';
import { NCFieldBase } from './fields';
export interface IArgumentField {
    name: string;
    type: string;
    field: NCFieldBase;
}
export interface IParsedArgument {
    name: string;
    type: string;
    value: unknown;
}
export declare enum NanoContractVertexType {
    TRANSACTION = "transaction",
    CREATE_TOKEN_TRANSACTION = "createTokenTransaction"
}
export declare enum NanoContractActionType {
    DEPOSIT = "deposit",
    WITHDRAWAL = "withdrawal",
    GRANT_AUTHORITY = "grant_authority",
    ACQUIRE_AUTHORITY = "acquire_authority"
}
export declare enum NanoContractHeaderActionType {
    DEPOSIT = 1,
    WITHDRAWAL = 2,
    GRANT_AUTHORITY = 3,
    ACQUIRE_AUTHORITY = 4
}
export declare const ActionTypeToActionHeaderType: Record<NanoContractActionType, NanoContractHeaderActionType>;
export interface NanoContractActionHeader {
    type: NanoContractHeaderActionType;
    tokenIndex: number;
    amount: OutputValueType;
}
export declare const INanoContractActionBase: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export declare const INanoContractActionTokenBase: z.ZodObject<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
}>, "strip", z.ZodTypeAny, {
    token: string;
    amount: bigint;
}, {
    token: string;
    amount: string | number | bigint;
}>;
export declare const INanoContractActionAuthorityBase: z.ZodObject<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    authority: z.ZodString;
}>, "strip", z.ZodTypeAny, {
    token: string;
    authority: string;
}, {
    token: string;
    authority: string;
}>;
export declare const INanoContractActionWithdrawalSchema: z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
}>, {
    type: z.ZodLiteral<"withdrawal">;
    address: z.ZodString;
}>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
}>, {
    type: z.ZodLiteral<"withdrawal">;
    address: z.ZodString;
}>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
}>, {
    type: z.ZodLiteral<"withdrawal">;
    address: z.ZodString;
}>, z.ZodTypeAny, "passthrough">>;
export declare const INanoContractActionDepositSchema: z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
}>, {
    type: z.ZodLiteral<"deposit">;
    address: z.ZodOptional<z.ZodString>;
    changeAddress: z.ZodOptional<z.ZodString>;
}>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
}>, {
    type: z.ZodLiteral<"deposit">;
    address: z.ZodOptional<z.ZodString>;
    changeAddress: z.ZodOptional<z.ZodString>;
}>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
}>, {
    type: z.ZodLiteral<"deposit">;
    address: z.ZodOptional<z.ZodString>;
    changeAddress: z.ZodOptional<z.ZodString>;
}>, z.ZodTypeAny, "passthrough">>;
export declare const INanoContractActionGrantAuthoritySchema: z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    authority: z.ZodString;
}>, {
    type: z.ZodLiteral<"grant_authority">;
    address: z.ZodOptional<z.ZodString>;
    authorityAddress: z.ZodOptional<z.ZodString>;
}>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    authority: z.ZodString;
}>, {
    type: z.ZodLiteral<"grant_authority">;
    address: z.ZodOptional<z.ZodString>;
    authorityAddress: z.ZodOptional<z.ZodString>;
}>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    authority: z.ZodString;
}>, {
    type: z.ZodLiteral<"grant_authority">;
    address: z.ZodOptional<z.ZodString>;
    authorityAddress: z.ZodOptional<z.ZodString>;
}>, z.ZodTypeAny, "passthrough">>;
export declare const INanoContractActionAcquireAuthoritySchema: z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    authority: z.ZodString;
}>, {
    type: z.ZodLiteral<"acquire_authority">;
    address: z.ZodString;
}>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    authority: z.ZodString;
}>, {
    type: z.ZodLiteral<"acquire_authority">;
    address: z.ZodString;
}>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    authority: z.ZodString;
}>, {
    type: z.ZodLiteral<"acquire_authority">;
    address: z.ZodString;
}>, z.ZodTypeAny, "passthrough">>;
export declare const INanoContractActionSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
}>, {
    type: z.ZodLiteral<"withdrawal">;
    address: z.ZodString;
}>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
}>, {
    type: z.ZodLiteral<"withdrawal">;
    address: z.ZodString;
}>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
}>, {
    type: z.ZodLiteral<"withdrawal">;
    address: z.ZodString;
}>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
}>, {
    type: z.ZodLiteral<"deposit">;
    address: z.ZodOptional<z.ZodString>;
    changeAddress: z.ZodOptional<z.ZodString>;
}>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
}>, {
    type: z.ZodLiteral<"deposit">;
    address: z.ZodOptional<z.ZodString>;
    changeAddress: z.ZodOptional<z.ZodString>;
}>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    amount: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
}>, {
    type: z.ZodLiteral<"deposit">;
    address: z.ZodOptional<z.ZodString>;
    changeAddress: z.ZodOptional<z.ZodString>;
}>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    authority: z.ZodString;
}>, {
    type: z.ZodLiteral<"grant_authority">;
    address: z.ZodOptional<z.ZodString>;
    authorityAddress: z.ZodOptional<z.ZodString>;
}>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    authority: z.ZodString;
}>, {
    type: z.ZodLiteral<"grant_authority">;
    address: z.ZodOptional<z.ZodString>;
    authorityAddress: z.ZodOptional<z.ZodString>;
}>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    authority: z.ZodString;
}>, {
    type: z.ZodLiteral<"grant_authority">;
    address: z.ZodOptional<z.ZodString>;
    authorityAddress: z.ZodOptional<z.ZodString>;
}>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    authority: z.ZodString;
}>, {
    type: z.ZodLiteral<"acquire_authority">;
    address: z.ZodString;
}>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    authority: z.ZodString;
}>, {
    type: z.ZodLiteral<"acquire_authority">;
    address: z.ZodString;
}>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<z.objectUtil.extendShape<{
    token: z.ZodString;
}, {
    authority: z.ZodString;
}>, {
    type: z.ZodLiteral<"acquire_authority">;
    address: z.ZodString;
}>, z.ZodTypeAny, "passthrough">>]>;
export type NanoContractAction = z.output<typeof INanoContractActionSchema>;
export interface MethodArgInfo {
    name: string;
    type: string;
}
interface MethodInfo {
    args: MethodArgInfo[];
    return_type?: string;
}
export interface NanoContractBlueprintInformationAPIResponse {
    id: string;
    name: string;
    attributes: Map<string, string>;
    public_methods: Map<string, MethodInfo>;
    private_methods: Map<string, MethodInfo>;
}
export interface NanoContractHistoryAPIResponse {
    success: boolean;
    count: number;
    after?: string;
    history: IHistoryTx[];
}
interface StateValueSuccess {
    value: unknown;
}
interface StateValueError {
    errmsg: string;
}
export interface NanoContractStateAPIResponse {
    success: boolean;
    nc_id: string;
    blueprint_name: string;
    fields: Map<string, StateValueSuccess | StateValueError>;
    balances: Map<string, StateValueSuccess | StateValueError>;
    calls: Map<string, StateValueSuccess | StateValueError>;
}
export interface NanoContractStateAPIParameters {
    id: string;
    fields: string[];
    balances: string[];
    calls: string[];
    block_hash?: string;
    block_height?: number;
}
/**
 * Buffer Read Only (RO) Extract value.
 * For methods that read a value from a buffer without altering the input buffer (read-only).
 * The method should return the value (T) extracted and the number of bytes read.
 * This way the caller has full control of the buffer since the method does not alter the inputs.
 */
export type BufferROExtract<T = unknown> = {
    value: T;
    bytesRead: number;
};
export interface NanoContractBuilderCreateTokenOptions {
    name: string;
    symbol: string;
    amount: OutputValueType;
    mintAddress: string;
    contractPaysTokenDeposit: boolean;
    changeAddress: string | null;
    createMint: boolean;
    mintAuthorityAddress: string | null;
    createMelt: boolean;
    meltAuthorityAddress: string | null;
    data: string[] | null;
    isCreateNFT: boolean;
}
/**
 * Data for creating a nano contract transaction
 */
export type CreateNanoTxData = {
    blueprintId?: string | null;
    ncId?: string | null;
    actions?: NanoContractAction[];
    args?: unknown[];
};
export {};
//# sourceMappingURL=types.d.ts.map