/// <reference types="node" />
import Transaction from '../models/transaction';
export declare enum CodeKind {
    PYTHON_ZLIB = 1
}
export declare class Code {
    kind: CodeKind;
    content: Buffer;
    constructor(kind: CodeKind, content: Buffer);
    serialize(): Buffer;
}
/**
 * The OnChainBlueprint class inherits the Transaction class, so it has all its attributes.
 *
 * We currently don't have support for creating an ocb object with inputs/outputs, so we receive as
 * parameters in the constructor only the data related to the ocb class itself.
 *
 * The code and the public key that will be used as caller to sign the transaction (just like the nano contract class).
 */
declare class OnChainBlueprint extends Transaction {
    code: Code;
    pubkey: Buffer;
    signature: Buffer | null;
    constructor(code: Code, pubkey: Buffer, signature?: Buffer | null);
    /**
     * Serialize funds fields
     * Add the serialized fields to the array parameter
     *
     * @param {array} Array of buffer to push the serialized fields
     * @param {addInputData} If should add input data or signature when serializing it
     *
     * @memberof OnChainBlueprint
     * @inner
     */
    serializeFundsFields(array: Buffer[], addInputData: boolean): void;
    /**
     * Serialize tx to bytes
     *
     * @memberof OnChainBlueprint
     * @inner
     */
    toBytes(): Buffer;
}
export default OnChainBlueprint;
//# sourceMappingURL=on_chain_blueprint.d.ts.map