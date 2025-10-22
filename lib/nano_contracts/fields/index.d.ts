/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { StrField } from './str';
import { IntField } from './int';
import { BytesField } from './bytes';
import { Bytes32Field } from './bytes32';
import { BoolField } from './bool';
import { AddressField } from './address';
import { TimestampField } from './timestamp';
import { AmountField } from './amount';
import { TokenUidField } from './token';
import { OptionalField } from './optional';
import { TupleField } from './tuple';
import { SignedDataField } from './signedData';
import { NCFieldBase } from './base';
import { DictField } from './dict';
import { CollectionField } from './collection';
export { NCFieldBase } from './base';
export declare function isSignedDataField(value: NCFieldBase): value is SignedDataField;
declare const _default: {
    StrField: typeof StrField;
    IntField: typeof IntField;
    BoolField: typeof BoolField;
    AddressField: typeof AddressField;
    TimestampField: typeof TimestampField;
    AmountField: typeof AmountField;
    TokenUidField: typeof TokenUidField;
    BytesField: typeof BytesField;
    TxOutputScriptField: typeof BytesField;
    VertexIdField: typeof Bytes32Field;
    ContractIdField: typeof Bytes32Field;
    BlueprintIdField: typeof Bytes32Field;
    OptionalField: typeof OptionalField;
    TupleField: typeof TupleField;
    SignedDataField: typeof SignedDataField;
    RawSignedDataField: typeof SignedDataField;
    DictField: typeof DictField;
    ListField: typeof CollectionField;
    SetField: typeof CollectionField;
    DequeField: typeof CollectionField;
    FrozenSetField: typeof CollectionField;
};
export default _default;
//# sourceMappingURL=index.d.ts.map