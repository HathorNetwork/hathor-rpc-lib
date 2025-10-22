/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { z } from 'zod';
import { AuthorityOutputInstruction, AuthoritySelectInstruction, CompleteTxInstruction, ConfigInstruction, DataOutputInstruction, NanoMethodInstruction, RawInputInstruction, RawOutputInstruction, SetVarInstruction, ShuffleInstruction, TokenOutputInstruction, TxTemplateInstruction, UtxoSelectInstruction } from './instructions';
import { TxTemplateContext } from './context';
import { ITxTemplateInterpreter } from './types';
/**
 * Find and run the executor function for the instruction.
 */
export declare function runInstruction(interpreter: ITxTemplateInterpreter, ctx: TxTemplateContext, ins: z.infer<typeof TxTemplateInstruction>): Promise<void>;
/**
 * Get the executor function for a specific instruction.
 * Since we parse the instruction we can guarantee the validity.
 */
export declare function findInstructionExecution(ins: unknown): (interpreter: ITxTemplateInterpreter, ctx: TxTemplateContext, ins: any) => Promise<void>;
/**
 * Execution for RawInputInstruction
 */
export declare function execRawInputInstruction(interpreter: ITxTemplateInterpreter, ctx: TxTemplateContext, ins: z.infer<typeof RawInputInstruction>): Promise<void>;
/**
 * Execution for UtxoSelectInstruction
 */
export declare function execUtxoSelectInstruction(interpreter: ITxTemplateInterpreter, ctx: TxTemplateContext, ins: z.infer<typeof UtxoSelectInstruction>): Promise<void>;
/**
 * Execution for AuthoritySelectInstruction
 */
export declare function execAuthoritySelectInstruction(interpreter: ITxTemplateInterpreter, ctx: TxTemplateContext, ins: z.infer<typeof AuthoritySelectInstruction>): Promise<void>;
/**
 * Execution for RawOutputInstruction
 */
export declare function execRawOutputInstruction(_interpreter: ITxTemplateInterpreter, ctx: TxTemplateContext, ins: z.infer<typeof RawOutputInstruction>): Promise<void>;
/**
 * Execution for DataOutputInstruction
 */
export declare function execDataOutputInstruction(_interpreter: ITxTemplateInterpreter, ctx: TxTemplateContext, ins: z.infer<typeof DataOutputInstruction>): Promise<void>;
/**
 * Execution for TokenOutputInstruction
 */
export declare function execTokenOutputInstruction(interpreter: ITxTemplateInterpreter, ctx: TxTemplateContext, ins: z.infer<typeof TokenOutputInstruction>): Promise<void>;
/**
 * Execution for AuthorityOutputInstruction
 */
export declare function execAuthorityOutputInstruction(interpreter: ITxTemplateInterpreter, ctx: TxTemplateContext, ins: z.infer<typeof AuthorityOutputInstruction>): Promise<void>;
/**
 * Execution for ShuffleInstruction
 */
export declare function execShuffleInstruction(_interpreter: ITxTemplateInterpreter, ctx: TxTemplateContext, ins: z.infer<typeof ShuffleInstruction>): Promise<void>;
/**
 * Execution for CompleteTxInstruction
 */
export declare function execCompleteTxInstruction(interpreter: ITxTemplateInterpreter, ctx: TxTemplateContext, ins: z.infer<typeof CompleteTxInstruction>): Promise<void>;
/**
 * Execution for ConfigInstruction
 */
export declare function execConfigInstruction(_interpreter: ITxTemplateInterpreter, ctx: TxTemplateContext, ins: z.infer<typeof ConfigInstruction>): Promise<void>;
/**
 * Execution for SetVarInstruction
 */
export declare function execSetVarInstruction(interpreter: ITxTemplateInterpreter, ctx: TxTemplateContext, ins: z.infer<typeof SetVarInstruction>): Promise<void>;
/**
 * Execution for NanoMethodInstruction
 */
export declare function execNanoMethodInstruction(_interpreter: ITxTemplateInterpreter, ctx: TxTemplateContext, ins: z.infer<typeof NanoMethodInstruction>): Promise<void>;
//# sourceMappingURL=executor.d.ts.map