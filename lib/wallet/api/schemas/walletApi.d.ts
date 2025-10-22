/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { z } from 'zod';
/**
 * Schema for validating Hathor addresses.
 * Addresses are base58 encoded and must be 34-35 characters long.
 * They can only contain characters from the base58 alphabet.
 */
export declare const AddressSchema: z.ZodString;
/**
 * Schema for validating BIP44 derivation paths.
 * Must start with 'm' followed by zero or more segments.
 * Each segment starts with '/' followed by numbers and may end with a single quote (').
 * Example: m/44'/280'/0'/0/0
 */
export declare const AddressPathSchema: z.ZodString;
/**
 * Schema for individual address information.
 * Represents a single address in the wallet with its derivation index and transaction count.
 */
export declare const getAddressesObjectSchema: z.ZodObject<{
    address: z.ZodString;
    index: z.ZodNumber;
    transactions: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    index: number;
    address: string;
    transactions: number;
}, {
    index: number;
    address: string;
    transactions: number;
}>;
/**
 * Response schema for getting all addresses in the wallet.
 */
export declare const addressesResponseSchema: z.ZodObject<z.objectUtil.extendShape<{
    success: z.ZodBoolean;
}, {
    addresses: z.ZodArray<z.ZodObject<{
        address: z.ZodString;
        index: z.ZodNumber;
        transactions: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        index: number;
        address: string;
        transactions: number;
    }, {
        index: number;
        address: string;
        transactions: number;
    }>, "many">;
}>, "strip", z.ZodTypeAny, {
    success: boolean;
    addresses: {
        index: number;
        address: string;
        transactions: number;
    }[];
}, {
    success: boolean;
    addresses: {
        index: number;
        address: string;
        transactions: number;
    }[];
}>;
/**
 * Response schema for getting address info in the wallet.
 */
export declare const getAddressDetailsObjectSchema: z.ZodObject<{
    address: z.ZodString;
    index: z.ZodNumber;
    transactions: z.ZodNumber;
    seqnum: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    index: number;
    address: string;
    seqnum: number;
    transactions: number;
}, {
    index: number;
    address: string;
    seqnum: number;
    transactions: number;
}>;
/**
 * Response schema for getting address details in the wallet.
 */
export declare const addressDetailsResponseSchema: z.ZodObject<z.objectUtil.extendShape<{
    success: z.ZodBoolean;
}, {
    data: z.ZodObject<{
        address: z.ZodString;
        index: z.ZodNumber;
        transactions: z.ZodNumber;
        seqnum: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        index: number;
        address: string;
        seqnum: number;
        transactions: number;
    }, {
        index: number;
        address: string;
        seqnum: number;
        transactions: number;
    }>;
}>, "strip", z.ZodTypeAny, {
    data: {
        index: number;
        address: string;
        seqnum: number;
        transactions: number;
    };
    success: boolean;
}, {
    data: {
        index: number;
        address: string;
        seqnum: number;
        transactions: number;
    };
    success: boolean;
}>;
/**
 * Response schema for checking if addresses belong to the wallet.
 * Maps addresses to boolean values indicating ownership.
 */
export declare const checkAddressesMineResponseSchema: z.ZodObject<z.objectUtil.extendShape<{
    success: z.ZodBoolean;
}, {
    addresses: z.ZodRecord<z.ZodString, z.ZodBoolean>;
}>, "strip", z.ZodTypeAny, {
    success: boolean;
    addresses: Record<string, boolean>;
}, {
    success: boolean;
    addresses: Record<string, boolean>;
}>;
/**
 * Schema for address information used in new address generation.
 */
export declare const addressInfoObjectSchema: z.ZodObject<{
    address: z.ZodString;
    index: z.ZodNumber;
    addressPath: z.ZodString;
    info: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    index: number;
    address: string;
    addressPath: string;
    info?: string | undefined;
}, {
    index: number;
    address: string;
    addressPath: string;
    info?: string | undefined;
}>;
/**
 * Response schema for generating new addresses.
 */
export declare const newAddressesResponseSchema: z.ZodObject<z.objectUtil.extendShape<{
    success: z.ZodBoolean;
}, {
    addresses: z.ZodArray<z.ZodObject<{
        address: z.ZodString;
        index: z.ZodNumber;
        addressPath: z.ZodString;
        info: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        index: number;
        address: string;
        addressPath: string;
        info?: string | undefined;
    }, {
        index: number;
        address: string;
        addressPath: string;
        info?: string | undefined;
    }>, "many">;
}>, "strip", z.ZodTypeAny, {
    success: boolean;
    addresses: {
        index: number;
        address: string;
        addressPath: string;
        info?: string | undefined;
    }[];
}, {
    success: boolean;
    addresses: {
        index: number;
        address: string;
        addressPath: string;
        info?: string | undefined;
    }[];
}>;
/**
 * TokenId schema
 */
export declare const tokenIdSchema: z.ZodUnion<[z.ZodString, z.ZodLiteral<string>]>;
/**
 * Schema for token information.
 */
export declare const tokenInfoSchema: z.ZodObject<{
    id: z.ZodUnion<[z.ZodString, z.ZodLiteral<string>]>;
    name: z.ZodString;
    symbol: z.ZodString;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    id: string;
    name: string;
}, {
    symbol: string;
    id: string;
    name: string;
}>;
/**
 * Response schema for token details.
 * Contains information about a token's name, symbol, total supply, and authorities.
 */
export declare const tokenDetailsResponseSchema: z.ZodObject<z.objectUtil.extendShape<{
    success: z.ZodBoolean;
}, {
    details: z.ZodObject<{
        tokenInfo: z.ZodObject<{
            id: z.ZodUnion<[z.ZodString, z.ZodLiteral<string>]>;
            name: z.ZodString;
            symbol: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            symbol: string;
            id: string;
            name: string;
        }, {
            symbol: string;
            id: string;
            name: string;
        }>;
        totalSupply: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        totalTransactions: z.ZodNumber;
        authorities: z.ZodObject<{
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            mint: boolean;
            melt: boolean;
        }, {
            mint: boolean;
            melt: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        authorities: {
            mint: boolean;
            melt: boolean;
        };
        tokenInfo: {
            symbol: string;
            id: string;
            name: string;
        };
        totalSupply: bigint;
        totalTransactions: number;
    }, {
        authorities: {
            mint: boolean;
            melt: boolean;
        };
        tokenInfo: {
            symbol: string;
            id: string;
            name: string;
        };
        totalSupply: string | number | bigint;
        totalTransactions: number;
    }>;
}>, "strip", z.ZodTypeAny, {
    details: {
        authorities: {
            mint: boolean;
            melt: boolean;
        };
        tokenInfo: {
            symbol: string;
            id: string;
            name: string;
        };
        totalSupply: bigint;
        totalTransactions: number;
    };
    success: boolean;
}, {
    details: {
        authorities: {
            mint: boolean;
            melt: boolean;
        };
        tokenInfo: {
            symbol: string;
            id: string;
            name: string;
        };
        totalSupply: string | number | bigint;
        totalTransactions: number;
    };
    success: boolean;
}>;
/**
 * Schema for token balance information.
 * Represents both unlocked and locked balances for a token.
 */
export declare const balanceSchema: z.ZodObject<{
    unlocked: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
    locked: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
}, "strip", z.ZodTypeAny, {
    locked: bigint;
    unlocked: bigint;
}, {
    locked: string | number | bigint;
    unlocked: string | number | bigint;
}>;
/**
 * Schema for token authority balances.
 * Represents mint and melt authority balances in both unlocked and locked states.
 */
export declare const authorityBalanceSchema: z.ZodObject<{
    unlocked: z.ZodObject<{
        mint: z.ZodBoolean;
        melt: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        mint: boolean;
        melt: boolean;
    }, {
        mint: boolean;
        melt: boolean;
    }>;
    locked: z.ZodObject<{
        mint: z.ZodBoolean;
        melt: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        mint: boolean;
        melt: boolean;
    }, {
        mint: boolean;
        melt: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    locked: {
        mint: boolean;
        melt: boolean;
    };
    unlocked: {
        mint: boolean;
        melt: boolean;
    };
}, {
    locked: {
        mint: boolean;
        melt: boolean;
    };
    unlocked: {
        mint: boolean;
        melt: boolean;
    };
}>;
/**
 * Schema for balance object.
 * Contains token info, balance, authorities, and transaction count.
 */
export declare const getBalanceObjectSchema: z.ZodObject<{
    token: z.ZodObject<{
        id: z.ZodUnion<[z.ZodString, z.ZodLiteral<string>]>;
        name: z.ZodString;
        symbol: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        id: string;
        name: string;
    }, {
        symbol: string;
        id: string;
        name: string;
    }>;
    balance: z.ZodObject<{
        unlocked: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        locked: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
    }, "strip", z.ZodTypeAny, {
        locked: bigint;
        unlocked: bigint;
    }, {
        locked: string | number | bigint;
        unlocked: string | number | bigint;
    }>;
    tokenAuthorities: z.ZodObject<{
        unlocked: z.ZodObject<{
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            mint: boolean;
            melt: boolean;
        }, {
            mint: boolean;
            melt: boolean;
        }>;
        locked: z.ZodObject<{
            mint: z.ZodBoolean;
            melt: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            mint: boolean;
            melt: boolean;
        }, {
            mint: boolean;
            melt: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        locked: {
            mint: boolean;
            melt: boolean;
        };
        unlocked: {
            mint: boolean;
            melt: boolean;
        };
    }, {
        locked: {
            mint: boolean;
            melt: boolean;
        };
        unlocked: {
            mint: boolean;
            melt: boolean;
        };
    }>;
    transactions: z.ZodNumber;
    lockExpires: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    balance: {
        locked: bigint;
        unlocked: bigint;
    };
    token: {
        symbol: string;
        id: string;
        name: string;
    };
    transactions: number;
    tokenAuthorities: {
        locked: {
            mint: boolean;
            melt: boolean;
        };
        unlocked: {
            mint: boolean;
            melt: boolean;
        };
    };
    lockExpires: number | null;
}, {
    balance: {
        locked: string | number | bigint;
        unlocked: string | number | bigint;
    };
    token: {
        symbol: string;
        id: string;
        name: string;
    };
    transactions: number;
    tokenAuthorities: {
        locked: {
            mint: boolean;
            melt: boolean;
        };
        unlocked: {
            mint: boolean;
            melt: boolean;
        };
    };
    lockExpires: number | null;
}>;
/**
 * Response schema for token balances.
 * Contains an array of balance objects for each token.
 */
export declare const balanceResponseSchema: z.ZodObject<z.objectUtil.extendShape<{
    success: z.ZodBoolean;
}, {
    balances: z.ZodArray<z.ZodObject<{
        token: z.ZodObject<{
            id: z.ZodUnion<[z.ZodString, z.ZodLiteral<string>]>;
            name: z.ZodString;
            symbol: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            symbol: string;
            id: string;
            name: string;
        }, {
            symbol: string;
            id: string;
            name: string;
        }>;
        balance: z.ZodObject<{
            unlocked: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            locked: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        }, "strip", z.ZodTypeAny, {
            locked: bigint;
            unlocked: bigint;
        }, {
            locked: string | number | bigint;
            unlocked: string | number | bigint;
        }>;
        tokenAuthorities: z.ZodObject<{
            unlocked: z.ZodObject<{
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                mint: boolean;
                melt: boolean;
            }, {
                mint: boolean;
                melt: boolean;
            }>;
            locked: z.ZodObject<{
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                mint: boolean;
                melt: boolean;
            }, {
                mint: boolean;
                melt: boolean;
            }>;
        }, "strip", z.ZodTypeAny, {
            locked: {
                mint: boolean;
                melt: boolean;
            };
            unlocked: {
                mint: boolean;
                melt: boolean;
            };
        }, {
            locked: {
                mint: boolean;
                melt: boolean;
            };
            unlocked: {
                mint: boolean;
                melt: boolean;
            };
        }>;
        transactions: z.ZodNumber;
        lockExpires: z.ZodNullable<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        balance: {
            locked: bigint;
            unlocked: bigint;
        };
        token: {
            symbol: string;
            id: string;
            name: string;
        };
        transactions: number;
        tokenAuthorities: {
            locked: {
                mint: boolean;
                melt: boolean;
            };
            unlocked: {
                mint: boolean;
                melt: boolean;
            };
        };
        lockExpires: number | null;
    }, {
        balance: {
            locked: string | number | bigint;
            unlocked: string | number | bigint;
        };
        token: {
            symbol: string;
            id: string;
            name: string;
        };
        transactions: number;
        tokenAuthorities: {
            locked: {
                mint: boolean;
                melt: boolean;
            };
            unlocked: {
                mint: boolean;
                melt: boolean;
            };
        };
        lockExpires: number | null;
    }>, "many">;
}>, "strip", z.ZodTypeAny, {
    success: boolean;
    balances: {
        balance: {
            locked: bigint;
            unlocked: bigint;
        };
        token: {
            symbol: string;
            id: string;
            name: string;
        };
        transactions: number;
        tokenAuthorities: {
            locked: {
                mint: boolean;
                melt: boolean;
            };
            unlocked: {
                mint: boolean;
                melt: boolean;
            };
        };
        lockExpires: number | null;
    }[];
}, {
    success: boolean;
    balances: {
        balance: {
            locked: string | number | bigint;
            unlocked: string | number | bigint;
        };
        token: {
            symbol: string;
            id: string;
            name: string;
        };
        transactions: number;
        tokenAuthorities: {
            locked: {
                mint: boolean;
                melt: boolean;
            };
            unlocked: {
                mint: boolean;
                melt: boolean;
            };
        };
        lockExpires: number | null;
    }[];
}>;
/**
 * Schema for transaction proposal inputs.
 * Represents the inputs that will be used in a transaction.
 */
export declare const txProposalInputsSchema: z.ZodObject<{
    txId: z.ZodString;
    index: z.ZodNumber;
    addressPath: z.ZodString;
}, "strip", z.ZodTypeAny, {
    index: number;
    txId: string;
    addressPath: string;
}, {
    index: number;
    txId: string;
    addressPath: string;
}>;
/**
 * Schema for transaction proposal outputs.
 * Represents the outputs that will be created in a transaction.
 */
export declare const txProposalOutputsSchema: z.ZodObject<{
    address: z.ZodString;
    value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
    token: z.ZodUnion<[z.ZodString, z.ZodLiteral<string>]>;
    timelock: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    address: string;
    value: bigint;
    timelock: number | null;
    token: string;
}, {
    address: string;
    value: string | number | bigint;
    timelock: number | null;
    token: string;
}>;
/**
 * Response schema for creating a transaction proposal.
 * Contains the proposal ID and the transaction details.
 */
export declare const txProposalCreateResponseSchema: z.ZodObject<z.objectUtil.extendShape<{
    success: z.ZodBoolean;
}, {
    txProposalId: z.ZodString;
    inputs: z.ZodArray<z.ZodObject<{
        txId: z.ZodString;
        index: z.ZodNumber;
        addressPath: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        index: number;
        txId: string;
        addressPath: string;
    }, {
        index: number;
        txId: string;
        addressPath: string;
    }>, "many">;
}>, "strip", z.ZodTypeAny, {
    success: boolean;
    inputs: {
        index: number;
        txId: string;
        addressPath: string;
    }[];
    txProposalId: string;
}, {
    success: boolean;
    inputs: {
        index: number;
        txId: string;
        addressPath: string;
    }[];
    txProposalId: string;
}>;
/**
 * Response schema for updating a transaction proposal.
 * Contains the proposal ID and the transaction hex.
 */
export declare const txProposalUpdateResponseSchema: z.ZodObject<z.objectUtil.extendShape<{
    success: z.ZodBoolean;
}, {
    txProposalId: z.ZodString;
    txHex: z.ZodString;
}>, "strip", z.ZodTypeAny, {
    success: boolean;
    txProposalId: string;
    txHex: string;
}, {
    success: boolean;
    txProposalId: string;
    txHex: string;
}>;
/**
 * Schema for full node version data.
 * Contains network parameters and configuration values.
 * Uses passthrough() to allow additional fields in the response without breaking validation,
 * as the full node may add new fields in future versions without changing the API version.
 */
export declare const fullNodeVersionDataSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
    version: z.ZodString;
    network: z.ZodString;
    minWeight: z.ZodNumber;
    minTxWeight: z.ZodNumber;
    minTxWeightCoefficient: z.ZodNumber;
    minTxWeightK: z.ZodNumber;
    tokenDepositPercentage: z.ZodNumber;
    rewardSpendMinBlocks: z.ZodNumber;
    maxNumberInputs: z.ZodNumber;
    maxNumberOutputs: z.ZodNumber;
    decimalPlaces: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    genesisBlockHash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    genesisTx1Hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    genesisTx2Hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    timestamp: z.ZodNumber;
    version: z.ZodString;
    network: z.ZodString;
    minWeight: z.ZodNumber;
    minTxWeight: z.ZodNumber;
    minTxWeightCoefficient: z.ZodNumber;
    minTxWeightK: z.ZodNumber;
    tokenDepositPercentage: z.ZodNumber;
    rewardSpendMinBlocks: z.ZodNumber;
    maxNumberInputs: z.ZodNumber;
    maxNumberOutputs: z.ZodNumber;
    decimalPlaces: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    genesisBlockHash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    genesisTx1Hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    genesisTx2Hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    timestamp: z.ZodNumber;
    version: z.ZodString;
    network: z.ZodString;
    minWeight: z.ZodNumber;
    minTxWeight: z.ZodNumber;
    minTxWeightCoefficient: z.ZodNumber;
    minTxWeightK: z.ZodNumber;
    tokenDepositPercentage: z.ZodNumber;
    rewardSpendMinBlocks: z.ZodNumber;
    maxNumberInputs: z.ZodNumber;
    maxNumberOutputs: z.ZodNumber;
    decimalPlaces: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    genesisBlockHash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    genesisTx1Hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    genesisTx2Hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Schema for full node transaction inputs.
 * Represents the inputs of a transaction as seen by the full node.
 */
export declare const fullNodeInputSchema: z.ZodObject<{
    value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
    token_data: z.ZodNumber;
    script: z.ZodString;
    decoded: z.ZodObject<{
        type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        value: z.ZodOptional<z.ZodNullable<z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>>>;
        token_data: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        type?: string | null | undefined;
        address?: string | null | undefined;
        value?: bigint | null | undefined;
        timelock?: number | null | undefined;
        token_data?: number | null | undefined;
    }, {
        type?: string | null | undefined;
        address?: string | null | undefined;
        value?: string | number | bigint | null | undefined;
        timelock?: number | null | undefined;
        token_data?: number | null | undefined;
    }>;
    tx_id: z.ZodString;
    index: z.ZodNumber;
    token: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodLiteral<string>]>>>;
    spent_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    index: number;
    value: bigint;
    script: string;
    token_data: number;
    decoded: {
        type?: string | null | undefined;
        address?: string | null | undefined;
        value?: bigint | null | undefined;
        timelock?: number | null | undefined;
        token_data?: number | null | undefined;
    };
    tx_id: string;
    token?: string | null | undefined;
    spent_by?: string | null | undefined;
}, {
    index: number;
    value: string | number | bigint;
    script: string;
    token_data: number;
    decoded: {
        type?: string | null | undefined;
        address?: string | null | undefined;
        value?: string | number | bigint | null | undefined;
        timelock?: number | null | undefined;
        token_data?: number | null | undefined;
    };
    tx_id: string;
    token?: string | null | undefined;
    spent_by?: string | null | undefined;
}>;
/**
 * Schema for full node transaction outputs.
 * Represents the outputs of a transaction as seen by the full node.
 */
export declare const fullNodeOutputSchema: z.ZodObject<{
    value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
    token_data: z.ZodNumber;
    script: z.ZodString;
    decoded: z.ZodObject<{
        type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        value: z.ZodOptional<z.ZodNullable<z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>>>;
        token_data: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        type?: string | null | undefined;
        address?: string | null | undefined;
        value?: bigint | null | undefined;
        timelock?: number | null | undefined;
        token_data?: number | null | undefined;
    }, {
        type?: string | null | undefined;
        address?: string | null | undefined;
        value?: string | number | bigint | null | undefined;
        timelock?: number | null | undefined;
        token_data?: number | null | undefined;
    }>;
    address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    token: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodLiteral<string>]>>>;
    authorities: z.ZodOptional<z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>>;
    timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    value: bigint;
    script: string;
    token_data: number;
    decoded: {
        type?: string | null | undefined;
        address?: string | null | undefined;
        value?: bigint | null | undefined;
        timelock?: number | null | undefined;
        token_data?: number | null | undefined;
    };
    address?: string | null | undefined;
    timelock?: number | null | undefined;
    authorities?: bigint | undefined;
    token?: string | null | undefined;
}, {
    value: string | number | bigint;
    script: string;
    token_data: number;
    decoded: {
        type?: string | null | undefined;
        address?: string | null | undefined;
        value?: string | number | bigint | null | undefined;
        timelock?: number | null | undefined;
        token_data?: number | null | undefined;
    };
    address?: string | null | undefined;
    timelock?: number | null | undefined;
    authorities?: string | number | bigint | undefined;
    token?: string | null | undefined;
}>;
/**
 * Schema for full node token information.
 * Represents token details as seen by the full node.
 * Note: amount is optional because this schema is reused across different APIs:
 * - Regular transaction APIs include amount field
 * - Nano contract token creation APIs only include uid, name, and symbol
 */
export declare const fullNodeTokenSchema: z.ZodObject<{
    uid: z.ZodString;
    name: z.ZodString;
    symbol: z.ZodString;
    amount: z.ZodOptional<z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    name: string;
    uid: string;
    amount?: bigint | undefined;
}, {
    symbol: string;
    name: string;
    uid: string;
    amount?: string | number | bigint | undefined;
}>;
/**
 * Schema for nano contract context actions.
 */
export declare const ncActionSchema: z.ZodObject<{
    type: z.ZodString;
    token_uid: z.ZodString;
    amount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: string;
    token_uid: string;
    amount: number;
}, {
    type: string;
    token_uid: string;
    amount: number;
}>;
/**
 * Schema for nano contract context.
 */
export declare const ncContextSchema: z.ZodObject<{
    actions: z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        token_uid: z.ZodString;
        amount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: string;
        token_uid: string;
        amount: number;
    }, {
        type: string;
        token_uid: string;
        amount: number;
    }>, "many">;
    address: z.ZodString;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    address: string;
    actions: {
        type: string;
        token_uid: string;
        amount: number;
    }[];
    timestamp: number;
}, {
    address: string;
    actions: {
        type: string;
        token_uid: string;
        amount: number;
    }[];
    timestamp: number;
}>;
/**
 * Schema for full node transaction data.
 * Contains all information about a transaction as seen by the full node.
 */
export declare const fullNodeTxSchema: z.ZodObject<{
    hash: z.ZodString;
    nonce: z.ZodString;
    timestamp: z.ZodNumber;
    version: z.ZodNumber;
    weight: z.ZodNumber;
    signal_bits: z.ZodOptional<z.ZodNumber>;
    parents: z.ZodArray<z.ZodString, "many">;
    inputs: z.ZodArray<z.ZodObject<{
        value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        token_data: z.ZodNumber;
        script: z.ZodString;
        decoded: z.ZodObject<{
            type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            value: z.ZodOptional<z.ZodNullable<z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>>>;
            token_data: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            type?: string | null | undefined;
            address?: string | null | undefined;
            value?: bigint | null | undefined;
            timelock?: number | null | undefined;
            token_data?: number | null | undefined;
        }, {
            type?: string | null | undefined;
            address?: string | null | undefined;
            value?: string | number | bigint | null | undefined;
            timelock?: number | null | undefined;
            token_data?: number | null | undefined;
        }>;
        tx_id: z.ZodString;
        index: z.ZodNumber;
        token: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodLiteral<string>]>>>;
        spent_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        index: number;
        value: bigint;
        script: string;
        token_data: number;
        decoded: {
            type?: string | null | undefined;
            address?: string | null | undefined;
            value?: bigint | null | undefined;
            timelock?: number | null | undefined;
            token_data?: number | null | undefined;
        };
        tx_id: string;
        token?: string | null | undefined;
        spent_by?: string | null | undefined;
    }, {
        index: number;
        value: string | number | bigint;
        script: string;
        token_data: number;
        decoded: {
            type?: string | null | undefined;
            address?: string | null | undefined;
            value?: string | number | bigint | null | undefined;
            timelock?: number | null | undefined;
            token_data?: number | null | undefined;
        };
        tx_id: string;
        token?: string | null | undefined;
        spent_by?: string | null | undefined;
    }>, "many">;
    outputs: z.ZodArray<z.ZodObject<{
        value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        token_data: z.ZodNumber;
        script: z.ZodString;
        decoded: z.ZodObject<{
            type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            value: z.ZodOptional<z.ZodNullable<z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>>>;
            token_data: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            type?: string | null | undefined;
            address?: string | null | undefined;
            value?: bigint | null | undefined;
            timelock?: number | null | undefined;
            token_data?: number | null | undefined;
        }, {
            type?: string | null | undefined;
            address?: string | null | undefined;
            value?: string | number | bigint | null | undefined;
            timelock?: number | null | undefined;
            token_data?: number | null | undefined;
        }>;
        address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        token: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodLiteral<string>]>>>;
        authorities: z.ZodOptional<z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>>;
        timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        value: bigint;
        script: string;
        token_data: number;
        decoded: {
            type?: string | null | undefined;
            address?: string | null | undefined;
            value?: bigint | null | undefined;
            timelock?: number | null | undefined;
            token_data?: number | null | undefined;
        };
        address?: string | null | undefined;
        timelock?: number | null | undefined;
        authorities?: bigint | undefined;
        token?: string | null | undefined;
    }, {
        value: string | number | bigint;
        script: string;
        token_data: number;
        decoded: {
            type?: string | null | undefined;
            address?: string | null | undefined;
            value?: string | number | bigint | null | undefined;
            timelock?: number | null | undefined;
            token_data?: number | null | undefined;
        };
        address?: string | null | undefined;
        timelock?: number | null | undefined;
        authorities?: string | number | bigint | undefined;
        token?: string | null | undefined;
    }>, "many">;
    tokens: z.ZodArray<z.ZodObject<{
        uid: z.ZodString;
        name: z.ZodString;
        symbol: z.ZodString;
        amount: z.ZodOptional<z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>>;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        name: string;
        uid: string;
        amount?: bigint | undefined;
    }, {
        symbol: string;
        name: string;
        uid: string;
        amount?: string | number | bigint | undefined;
    }>, "many">;
    token_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    token_symbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nc_id: z.ZodOptional<z.ZodString>;
    nc_seqnum: z.ZodOptional<z.ZodNumber>;
    nc_blueprint_id: z.ZodOptional<z.ZodString>;
    nc_method: z.ZodOptional<z.ZodString>;
    nc_args: z.ZodOptional<z.ZodString>;
    nc_address: z.ZodOptional<z.ZodString>;
    nc_context: z.ZodOptional<z.ZodObject<{
        actions: z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            token_uid: z.ZodString;
            amount: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            type: string;
            token_uid: string;
            amount: number;
        }, {
            type: string;
            token_uid: string;
            amount: number;
        }>, "many">;
        address: z.ZodString;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        address: string;
        actions: {
            type: string;
            token_uid: string;
            amount: number;
        }[];
        timestamp: number;
    }, {
        address: string;
        actions: {
            type: string;
            token_uid: string;
            amount: number;
        }[];
        timestamp: number;
    }>>;
    raw: z.ZodString;
}, "strip", z.ZodTypeAny, {
    raw: string;
    nonce: string;
    hash: string;
    tokens: {
        symbol: string;
        name: string;
        uid: string;
        amount?: bigint | undefined;
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
            type?: string | null | undefined;
            address?: string | null | undefined;
            value?: bigint | null | undefined;
            timelock?: number | null | undefined;
            token_data?: number | null | undefined;
        };
        tx_id: string;
        token?: string | null | undefined;
        spent_by?: string | null | undefined;
    }[];
    outputs: {
        value: bigint;
        script: string;
        token_data: number;
        decoded: {
            type?: string | null | undefined;
            address?: string | null | undefined;
            value?: bigint | null | undefined;
            timelock?: number | null | undefined;
            token_data?: number | null | undefined;
        };
        address?: string | null | undefined;
        timelock?: number | null | undefined;
        authorities?: bigint | undefined;
        token?: string | null | undefined;
    }[];
    parents: string[];
    token_name?: string | null | undefined;
    token_symbol?: string | null | undefined;
    nc_id?: string | undefined;
    nc_blueprint_id?: string | undefined;
    nc_method?: string | undefined;
    nc_args?: string | undefined;
    nc_address?: string | undefined;
    nc_context?: {
        address: string;
        actions: {
            type: string;
            token_uid: string;
            amount: number;
        }[];
        timestamp: number;
    } | undefined;
    nc_seqnum?: number | undefined;
    signal_bits?: number | undefined;
}, {
    raw: string;
    nonce: string;
    hash: string;
    tokens: {
        symbol: string;
        name: string;
        uid: string;
        amount?: string | number | bigint | undefined;
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
            type?: string | null | undefined;
            address?: string | null | undefined;
            value?: string | number | bigint | null | undefined;
            timelock?: number | null | undefined;
            token_data?: number | null | undefined;
        };
        tx_id: string;
        token?: string | null | undefined;
        spent_by?: string | null | undefined;
    }[];
    outputs: {
        value: string | number | bigint;
        script: string;
        token_data: number;
        decoded: {
            type?: string | null | undefined;
            address?: string | null | undefined;
            value?: string | number | bigint | null | undefined;
            timelock?: number | null | undefined;
            token_data?: number | null | undefined;
        };
        address?: string | null | undefined;
        timelock?: number | null | undefined;
        authorities?: string | number | bigint | undefined;
        token?: string | null | undefined;
    }[];
    parents: string[];
    token_name?: string | null | undefined;
    token_symbol?: string | null | undefined;
    nc_id?: string | undefined;
    nc_blueprint_id?: string | undefined;
    nc_method?: string | undefined;
    nc_args?: string | undefined;
    nc_address?: string | undefined;
    nc_context?: {
        address: string;
        actions: {
            type: string;
            token_uid: string;
            amount: number;
        }[];
        timestamp: number;
    } | undefined;
    nc_seqnum?: number | undefined;
    signal_bits?: number | undefined;
}>;
/**
 * Schema for full node transaction metadata.
 * Contains additional information about a transaction's status and relationships.
 */
export declare const fullNodeMetaSchema: z.ZodObject<{
    hash: z.ZodString;
    received_by: z.ZodArray<z.ZodString, "many">;
    children: z.ZodArray<z.ZodString, "many">;
    conflict_with: z.ZodArray<z.ZodString, "many">;
    first_block: z.ZodNullable<z.ZodString>;
    height: z.ZodNumber;
    voided_by: z.ZodArray<z.ZodString, "many">;
    spent_outputs: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodArray<z.ZodString, "many">], null>, "many">;
    received_timestamp: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    is_voided: z.ZodOptional<z.ZodBoolean>;
    verification_status: z.ZodOptional<z.ZodString>;
    twins: z.ZodArray<z.ZodString, "many">;
    accumulated_weight: z.ZodNumber;
    score: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    height: number;
    children: string[];
    hash: string;
    first_block: string | null;
    spent_outputs: [number, string[]][];
    received_by: string[];
    conflict_with: string[];
    voided_by: string[];
    twins: string[];
    accumulated_weight: number;
    score: number;
    is_voided?: boolean | undefined;
    received_timestamp?: number | null | undefined;
    verification_status?: string | undefined;
}, {
    height: number;
    children: string[];
    hash: string;
    first_block: string | null;
    spent_outputs: [number, string[]][];
    received_by: string[];
    conflict_with: string[];
    voided_by: string[];
    twins: string[];
    accumulated_weight: number;
    score: number;
    is_voided?: boolean | undefined;
    received_timestamp?: number | null | undefined;
    verification_status?: string | undefined;
}>;
/**
 * Response schema for full node transaction data.
 * Contains the transaction details, metadata, and optional message.
 */
export declare const fullNodeTxResponseSchema: z.ZodObject<z.objectUtil.extendShape<{
    success: z.ZodBoolean;
}, {
    tx: z.ZodObject<{
        hash: z.ZodString;
        nonce: z.ZodString;
        timestamp: z.ZodNumber;
        version: z.ZodNumber;
        weight: z.ZodNumber;
        signal_bits: z.ZodOptional<z.ZodNumber>;
        parents: z.ZodArray<z.ZodString, "many">;
        inputs: z.ZodArray<z.ZodObject<{
            value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            token_data: z.ZodNumber;
            script: z.ZodString;
            decoded: z.ZodObject<{
                type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                value: z.ZodOptional<z.ZodNullable<z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>>>;
                token_data: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                type?: string | null | undefined;
                address?: string | null | undefined;
                value?: bigint | null | undefined;
                timelock?: number | null | undefined;
                token_data?: number | null | undefined;
            }, {
                type?: string | null | undefined;
                address?: string | null | undefined;
                value?: string | number | bigint | null | undefined;
                timelock?: number | null | undefined;
                token_data?: number | null | undefined;
            }>;
            tx_id: z.ZodString;
            index: z.ZodNumber;
            token: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodLiteral<string>]>>>;
            spent_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            index: number;
            value: bigint;
            script: string;
            token_data: number;
            decoded: {
                type?: string | null | undefined;
                address?: string | null | undefined;
                value?: bigint | null | undefined;
                timelock?: number | null | undefined;
                token_data?: number | null | undefined;
            };
            tx_id: string;
            token?: string | null | undefined;
            spent_by?: string | null | undefined;
        }, {
            index: number;
            value: string | number | bigint;
            script: string;
            token_data: number;
            decoded: {
                type?: string | null | undefined;
                address?: string | null | undefined;
                value?: string | number | bigint | null | undefined;
                timelock?: number | null | undefined;
                token_data?: number | null | undefined;
            };
            tx_id: string;
            token?: string | null | undefined;
            spent_by?: string | null | undefined;
        }>, "many">;
        outputs: z.ZodArray<z.ZodObject<{
            value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            token_data: z.ZodNumber;
            script: z.ZodString;
            decoded: z.ZodObject<{
                type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                value: z.ZodOptional<z.ZodNullable<z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>>>;
                token_data: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                type?: string | null | undefined;
                address?: string | null | undefined;
                value?: bigint | null | undefined;
                timelock?: number | null | undefined;
                token_data?: number | null | undefined;
            }, {
                type?: string | null | undefined;
                address?: string | null | undefined;
                value?: string | number | bigint | null | undefined;
                timelock?: number | null | undefined;
                token_data?: number | null | undefined;
            }>;
            address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            token: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodLiteral<string>]>>>;
            authorities: z.ZodOptional<z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>>;
            timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            value: bigint;
            script: string;
            token_data: number;
            decoded: {
                type?: string | null | undefined;
                address?: string | null | undefined;
                value?: bigint | null | undefined;
                timelock?: number | null | undefined;
                token_data?: number | null | undefined;
            };
            address?: string | null | undefined;
            timelock?: number | null | undefined;
            authorities?: bigint | undefined;
            token?: string | null | undefined;
        }, {
            value: string | number | bigint;
            script: string;
            token_data: number;
            decoded: {
                type?: string | null | undefined;
                address?: string | null | undefined;
                value?: string | number | bigint | null | undefined;
                timelock?: number | null | undefined;
                token_data?: number | null | undefined;
            };
            address?: string | null | undefined;
            timelock?: number | null | undefined;
            authorities?: string | number | bigint | undefined;
            token?: string | null | undefined;
        }>, "many">;
        tokens: z.ZodArray<z.ZodObject<{
            uid: z.ZodString;
            name: z.ZodString;
            symbol: z.ZodString;
            amount: z.ZodOptional<z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>>;
        }, "strip", z.ZodTypeAny, {
            symbol: string;
            name: string;
            uid: string;
            amount?: bigint | undefined;
        }, {
            symbol: string;
            name: string;
            uid: string;
            amount?: string | number | bigint | undefined;
        }>, "many">;
        token_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        token_symbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        nc_id: z.ZodOptional<z.ZodString>;
        nc_seqnum: z.ZodOptional<z.ZodNumber>;
        nc_blueprint_id: z.ZodOptional<z.ZodString>;
        nc_method: z.ZodOptional<z.ZodString>;
        nc_args: z.ZodOptional<z.ZodString>;
        nc_address: z.ZodOptional<z.ZodString>;
        nc_context: z.ZodOptional<z.ZodObject<{
            actions: z.ZodArray<z.ZodObject<{
                type: z.ZodString;
                token_uid: z.ZodString;
                amount: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                type: string;
                token_uid: string;
                amount: number;
            }, {
                type: string;
                token_uid: string;
                amount: number;
            }>, "many">;
            address: z.ZodString;
            timestamp: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            address: string;
            actions: {
                type: string;
                token_uid: string;
                amount: number;
            }[];
            timestamp: number;
        }, {
            address: string;
            actions: {
                type: string;
                token_uid: string;
                amount: number;
            }[];
            timestamp: number;
        }>>;
        raw: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        raw: string;
        nonce: string;
        hash: string;
        tokens: {
            symbol: string;
            name: string;
            uid: string;
            amount?: bigint | undefined;
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
                type?: string | null | undefined;
                address?: string | null | undefined;
                value?: bigint | null | undefined;
                timelock?: number | null | undefined;
                token_data?: number | null | undefined;
            };
            tx_id: string;
            token?: string | null | undefined;
            spent_by?: string | null | undefined;
        }[];
        outputs: {
            value: bigint;
            script: string;
            token_data: number;
            decoded: {
                type?: string | null | undefined;
                address?: string | null | undefined;
                value?: bigint | null | undefined;
                timelock?: number | null | undefined;
                token_data?: number | null | undefined;
            };
            address?: string | null | undefined;
            timelock?: number | null | undefined;
            authorities?: bigint | undefined;
            token?: string | null | undefined;
        }[];
        parents: string[];
        token_name?: string | null | undefined;
        token_symbol?: string | null | undefined;
        nc_id?: string | undefined;
        nc_blueprint_id?: string | undefined;
        nc_method?: string | undefined;
        nc_args?: string | undefined;
        nc_address?: string | undefined;
        nc_context?: {
            address: string;
            actions: {
                type: string;
                token_uid: string;
                amount: number;
            }[];
            timestamp: number;
        } | undefined;
        nc_seqnum?: number | undefined;
        signal_bits?: number | undefined;
    }, {
        raw: string;
        nonce: string;
        hash: string;
        tokens: {
            symbol: string;
            name: string;
            uid: string;
            amount?: string | number | bigint | undefined;
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
                type?: string | null | undefined;
                address?: string | null | undefined;
                value?: string | number | bigint | null | undefined;
                timelock?: number | null | undefined;
                token_data?: number | null | undefined;
            };
            tx_id: string;
            token?: string | null | undefined;
            spent_by?: string | null | undefined;
        }[];
        outputs: {
            value: string | number | bigint;
            script: string;
            token_data: number;
            decoded: {
                type?: string | null | undefined;
                address?: string | null | undefined;
                value?: string | number | bigint | null | undefined;
                timelock?: number | null | undefined;
                token_data?: number | null | undefined;
            };
            address?: string | null | undefined;
            timelock?: number | null | undefined;
            authorities?: string | number | bigint | undefined;
            token?: string | null | undefined;
        }[];
        parents: string[];
        token_name?: string | null | undefined;
        token_symbol?: string | null | undefined;
        nc_id?: string | undefined;
        nc_blueprint_id?: string | undefined;
        nc_method?: string | undefined;
        nc_args?: string | undefined;
        nc_address?: string | undefined;
        nc_context?: {
            address: string;
            actions: {
                type: string;
                token_uid: string;
                amount: number;
            }[];
            timestamp: number;
        } | undefined;
        nc_seqnum?: number | undefined;
        signal_bits?: number | undefined;
    }>;
    meta: z.ZodObject<{
        hash: z.ZodString;
        received_by: z.ZodArray<z.ZodString, "many">;
        children: z.ZodArray<z.ZodString, "many">;
        conflict_with: z.ZodArray<z.ZodString, "many">;
        first_block: z.ZodNullable<z.ZodString>;
        height: z.ZodNumber;
        voided_by: z.ZodArray<z.ZodString, "many">;
        spent_outputs: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodArray<z.ZodString, "many">], null>, "many">;
        received_timestamp: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        is_voided: z.ZodOptional<z.ZodBoolean>;
        verification_status: z.ZodOptional<z.ZodString>;
        twins: z.ZodArray<z.ZodString, "many">;
        accumulated_weight: z.ZodNumber;
        score: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        height: number;
        children: string[];
        hash: string;
        first_block: string | null;
        spent_outputs: [number, string[]][];
        received_by: string[];
        conflict_with: string[];
        voided_by: string[];
        twins: string[];
        accumulated_weight: number;
        score: number;
        is_voided?: boolean | undefined;
        received_timestamp?: number | null | undefined;
        verification_status?: string | undefined;
    }, {
        height: number;
        children: string[];
        hash: string;
        first_block: string | null;
        spent_outputs: [number, string[]][];
        received_by: string[];
        conflict_with: string[];
        voided_by: string[];
        twins: string[];
        accumulated_weight: number;
        score: number;
        is_voided?: boolean | undefined;
        received_timestamp?: number | null | undefined;
        verification_status?: string | undefined;
    }>;
    message: z.ZodOptional<z.ZodString>;
    spent_outputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}>, "strip", z.ZodTypeAny, {
    meta: {
        height: number;
        children: string[];
        hash: string;
        first_block: string | null;
        spent_outputs: [number, string[]][];
        received_by: string[];
        conflict_with: string[];
        voided_by: string[];
        twins: string[];
        accumulated_weight: number;
        score: number;
        is_voided?: boolean | undefined;
        received_timestamp?: number | null | undefined;
        verification_status?: string | undefined;
    };
    success: boolean;
    tx: {
        raw: string;
        nonce: string;
        hash: string;
        tokens: {
            symbol: string;
            name: string;
            uid: string;
            amount?: bigint | undefined;
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
                type?: string | null | undefined;
                address?: string | null | undefined;
                value?: bigint | null | undefined;
                timelock?: number | null | undefined;
                token_data?: number | null | undefined;
            };
            tx_id: string;
            token?: string | null | undefined;
            spent_by?: string | null | undefined;
        }[];
        outputs: {
            value: bigint;
            script: string;
            token_data: number;
            decoded: {
                type?: string | null | undefined;
                address?: string | null | undefined;
                value?: bigint | null | undefined;
                timelock?: number | null | undefined;
                token_data?: number | null | undefined;
            };
            address?: string | null | undefined;
            timelock?: number | null | undefined;
            authorities?: bigint | undefined;
            token?: string | null | undefined;
        }[];
        parents: string[];
        token_name?: string | null | undefined;
        token_symbol?: string | null | undefined;
        nc_id?: string | undefined;
        nc_blueprint_id?: string | undefined;
        nc_method?: string | undefined;
        nc_args?: string | undefined;
        nc_address?: string | undefined;
        nc_context?: {
            address: string;
            actions: {
                type: string;
                token_uid: string;
                amount: number;
            }[];
            timestamp: number;
        } | undefined;
        nc_seqnum?: number | undefined;
        signal_bits?: number | undefined;
    };
    message?: string | undefined;
    spent_outputs?: Record<string, string> | undefined;
}, {
    meta: {
        height: number;
        children: string[];
        hash: string;
        first_block: string | null;
        spent_outputs: [number, string[]][];
        received_by: string[];
        conflict_with: string[];
        voided_by: string[];
        twins: string[];
        accumulated_weight: number;
        score: number;
        is_voided?: boolean | undefined;
        received_timestamp?: number | null | undefined;
        verification_status?: string | undefined;
    };
    success: boolean;
    tx: {
        raw: string;
        nonce: string;
        hash: string;
        tokens: {
            symbol: string;
            name: string;
            uid: string;
            amount?: string | number | bigint | undefined;
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
                type?: string | null | undefined;
                address?: string | null | undefined;
                value?: string | number | bigint | null | undefined;
                timelock?: number | null | undefined;
                token_data?: number | null | undefined;
            };
            tx_id: string;
            token?: string | null | undefined;
            spent_by?: string | null | undefined;
        }[];
        outputs: {
            value: string | number | bigint;
            script: string;
            token_data: number;
            decoded: {
                type?: string | null | undefined;
                address?: string | null | undefined;
                value?: string | number | bigint | null | undefined;
                timelock?: number | null | undefined;
                token_data?: number | null | undefined;
            };
            address?: string | null | undefined;
            timelock?: number | null | undefined;
            authorities?: string | number | bigint | undefined;
            token?: string | null | undefined;
        }[];
        parents: string[];
        token_name?: string | null | undefined;
        token_symbol?: string | null | undefined;
        nc_id?: string | undefined;
        nc_blueprint_id?: string | undefined;
        nc_method?: string | undefined;
        nc_args?: string | undefined;
        nc_address?: string | undefined;
        nc_context?: {
            address: string;
            actions: {
                type: string;
                token_uid: string;
                amount: number;
            }[];
            timestamp: number;
        } | undefined;
        nc_seqnum?: number | undefined;
        signal_bits?: number | undefined;
    };
    message?: string | undefined;
    spent_outputs?: Record<string, string> | undefined;
}>;
/**
 * Response schema for transaction confirmation data.
 * Contains information about the transaction's confirmation status and weight.
 */
export declare const fullNodeTxConfirmationDataResponseSchema: z.ZodObject<z.objectUtil.extendShape<{
    success: z.ZodBoolean;
}, {
    accumulated_weight: z.ZodNumber;
    accumulated_bigger: z.ZodBoolean;
    stop_value: z.ZodNumber;
    confirmation_level: z.ZodNumber;
}>, "strip", z.ZodTypeAny, {
    success: boolean;
    accumulated_weight: number;
    accumulated_bigger: boolean;
    stop_value: number;
    confirmation_level: number;
}, {
    success: boolean;
    accumulated_weight: number;
    accumulated_bigger: boolean;
    stop_value: number;
    confirmation_level: number;
}>;
/**
 * Response schema for wallet status.
 * Contains information about the wallet's current state.
 */
export declare const walletStatusResponseSchema: z.ZodObject<z.objectUtil.extendShape<{
    success: z.ZodBoolean;
}, {
    status: z.ZodObject<{
        walletId: z.ZodString;
        xpubkey: z.ZodString;
        status: z.ZodString;
        maxGap: z.ZodNumber;
        createdAt: z.ZodNumber;
        readyAt: z.ZodNullable<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        status: string;
        xpubkey: string;
        walletId: string;
        maxGap: number;
        createdAt: number;
        readyAt: number | null;
    }, {
        status: string;
        xpubkey: string;
        walletId: string;
        maxGap: number;
        createdAt: number;
        readyAt: number | null;
    }>;
    error: z.ZodOptional<z.ZodString>;
}>, "strip", z.ZodTypeAny, {
    success: boolean;
    status: {
        status: string;
        xpubkey: string;
        walletId: string;
        maxGap: number;
        createdAt: number;
        readyAt: number | null;
    };
    error?: string | undefined;
}, {
    success: boolean;
    status: {
        status: string;
        xpubkey: string;
        walletId: string;
        maxGap: number;
        createdAt: number;
        readyAt: number | null;
    };
    error?: string | undefined;
}>;
/**
 * Response schema for token list.
 * Contains an array of token information.
 */
export declare const tokensResponseSchema: z.ZodObject<z.objectUtil.extendShape<{
    success: z.ZodBoolean;
}, {
    tokens: z.ZodArray<z.ZodString, "many">;
}>, "strip", z.ZodTypeAny, {
    success: boolean;
    tokens: string[];
}, {
    success: boolean;
    tokens: string[];
}>;
/**
 * Response schema for transaction history.
 * Contains an array of transaction information.
 */
export declare const historyResponseSchema: z.ZodObject<z.objectUtil.extendShape<{
    success: z.ZodBoolean;
}, {
    history: z.ZodArray<z.ZodObject<{
        txId: z.ZodString;
        balance: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        timestamp: z.ZodNumber;
        voided: z.ZodEffects<z.ZodNumber, boolean, number>;
        version: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        balance: bigint;
        timestamp: number;
        version: number;
        txId: string;
        voided: boolean;
    }, {
        balance: string | number | bigint;
        timestamp: number;
        version: number;
        txId: string;
        voided: number;
    }>, "many">;
}>, "strip", z.ZodTypeAny, {
    success: boolean;
    history: {
        balance: bigint;
        timestamp: number;
        version: number;
        txId: string;
        voided: boolean;
    }[];
}, {
    success: boolean;
    history: {
        balance: string | number | bigint;
        timestamp: number;
        version: number;
        txId: string;
        voided: number;
    }[];
}>;
/**
 * Response schema for transaction outputs.
 * Contains an array of unspent transaction outputs.
 */
export declare const txOutputResponseSchema: z.ZodObject<z.objectUtil.extendShape<{
    success: z.ZodBoolean;
}, {
    txOutputs: z.ZodArray<z.ZodObject<{
        txId: z.ZodString;
        index: z.ZodNumber;
        tokenId: z.ZodString;
        address: z.ZodString;
        value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        authorities: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        timelock: z.ZodNullable<z.ZodNumber>;
        heightlock: z.ZodNullable<z.ZodNumber>;
        locked: z.ZodBoolean;
        addressPath: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        index: number;
        address: string;
        value: bigint;
        timelock: number | null;
        locked: boolean;
        authorities: bigint;
        txId: string;
        addressPath: string;
        tokenId: string;
        heightlock: number | null;
    }, {
        index: number;
        address: string;
        value: string | number | bigint;
        timelock: number | null;
        locked: boolean;
        authorities: string | number | bigint;
        txId: string;
        addressPath: string;
        tokenId: string;
        heightlock: number | null;
    }>, "many">;
}>, "strip", z.ZodTypeAny, {
    success: boolean;
    txOutputs: {
        index: number;
        address: string;
        value: bigint;
        timelock: number | null;
        locked: boolean;
        authorities: bigint;
        txId: string;
        addressPath: string;
        tokenId: string;
        heightlock: number | null;
    }[];
}, {
    success: boolean;
    txOutputs: {
        index: number;
        address: string;
        value: string | number | bigint;
        timelock: number | null;
        locked: boolean;
        authorities: string | number | bigint;
        txId: string;
        addressPath: string;
        tokenId: string;
        heightlock: number | null;
    }[];
}>;
/**
 * Response schema for authentication token.
 * Contains the authentication token.
 */
export declare const authTokenResponseSchema: z.ZodObject<z.objectUtil.extendShape<{
    success: z.ZodBoolean;
}, {
    token: z.ZodString;
}>, "strip", z.ZodTypeAny, {
    success: boolean;
    token: string;
}, {
    success: boolean;
    token: string;
}>;
/**
 * Schema for transaction by ID response.
 * Contains detailed information about a specific transaction.
 */
export declare const txByIdResponseSchema: z.ZodObject<z.objectUtil.extendShape<{
    success: z.ZodBoolean;
}, {
    txTokens: z.ZodArray<z.ZodObject<{
        txId: z.ZodString;
        timestamp: z.ZodNumber;
        version: z.ZodNumber;
        voided: z.ZodBoolean;
        height: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        weight: z.ZodNumber;
        balance: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        tokenId: z.ZodString;
        tokenName: z.ZodString;
        tokenSymbol: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        balance: bigint;
        timestamp: number;
        version: number;
        weight: number;
        txId: string;
        voided: boolean;
        tokenId: string;
        tokenName: string;
        tokenSymbol: string;
        height?: number | null | undefined;
    }, {
        balance: string | number | bigint;
        timestamp: number;
        version: number;
        weight: number;
        txId: string;
        voided: boolean;
        tokenId: string;
        tokenName: string;
        tokenSymbol: string;
        height?: number | null | undefined;
    }>, "many">;
}>, "strip", z.ZodTypeAny, {
    success: boolean;
    txTokens: {
        balance: bigint;
        timestamp: number;
        version: number;
        weight: number;
        txId: string;
        voided: boolean;
        tokenId: string;
        tokenName: string;
        tokenSymbol: string;
        height?: number | null | undefined;
    }[];
}, {
    success: boolean;
    txTokens: {
        balance: string | number | bigint;
        timestamp: number;
        version: number;
        weight: number;
        txId: string;
        voided: boolean;
        tokenId: string;
        tokenName: string;
        tokenSymbol: string;
        height?: number | null | undefined;
    }[];
}>;
/**
 * Schema for transaction input.
 * Represents a transaction input with its decoded data.
 */
export declare const txInputSchema: z.ZodObject<{
    tx_id: z.ZodString;
    index: z.ZodNumber;
    value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
    token_data: z.ZodNumber;
    script: z.ZodString;
    decoded: z.ZodObject<{
        type: z.ZodString;
        address: z.ZodString;
        timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        token_data: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: string;
        address: string;
        value: bigint;
        token_data: number;
        timelock?: number | null | undefined;
    }, {
        type: string;
        address: string;
        value: string | number | bigint;
        token_data: number;
        timelock?: number | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    index: number;
    value: bigint;
    script: string;
    token_data: number;
    decoded: {
        type: string;
        address: string;
        value: bigint;
        token_data: number;
        timelock?: number | null | undefined;
    };
    tx_id: string;
}, {
    index: number;
    value: string | number | bigint;
    script: string;
    token_data: number;
    decoded: {
        type: string;
        address: string;
        value: string | number | bigint;
        token_data: number;
        timelock?: number | null | undefined;
    };
    tx_id: string;
}>;
/**
 * Schema for transaction output.
 * Represents a transaction output with its decoded data.
 */
export declare const txOutputSchema: z.ZodObject<{
    index: z.ZodNumber;
    value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
    token_data: z.ZodNumber;
    script: z.ZodString;
    decoded: z.ZodObject<{
        type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        address: z.ZodOptional<z.ZodString>;
        timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        token_data: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        value: bigint;
        type?: string | null | undefined;
        address?: string | undefined;
        timelock?: number | null | undefined;
        token_data?: number | undefined;
    }, {
        value: string | number | bigint;
        type?: string | null | undefined;
        address?: string | undefined;
        timelock?: number | null | undefined;
        token_data?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    index: number;
    value: bigint;
    script: string;
    token_data: number;
    decoded: {
        value: bigint;
        type?: string | null | undefined;
        address?: string | undefined;
        timelock?: number | null | undefined;
        token_data?: number | undefined;
    };
}, {
    index: number;
    value: string | number | bigint;
    script: string;
    token_data: number;
    decoded: {
        value: string | number | bigint;
        type?: string | null | undefined;
        address?: string | undefined;
        timelock?: number | null | undefined;
        token_data?: number | undefined;
    };
}>;
/**
 * Schema for websocket transaction events.
 * Represents the structure of transactions received via websocket.
 */
export declare const wsTransactionSchema: z.ZodObject<{
    tx_id: z.ZodString;
    nonce: z.ZodNumber;
    timestamp: z.ZodNumber;
    version: z.ZodNumber;
    voided: z.ZodBoolean;
    weight: z.ZodNumber;
    parents: z.ZodArray<z.ZodString, "many">;
    inputs: z.ZodArray<z.ZodObject<{
        tx_id: z.ZodString;
        index: z.ZodNumber;
        value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        token_data: z.ZodNumber;
        script: z.ZodObject<{
            type: z.ZodLiteral<"Buffer">;
            data: z.ZodArray<z.ZodNumber, "many">;
        }, "strip", z.ZodTypeAny, {
            type: "Buffer";
            data: number[];
        }, {
            type: "Buffer";
            data: number[];
        }>;
        token: z.ZodUnion<[z.ZodString, z.ZodLiteral<string>]>;
        decoded: z.ZodObject<{
            type: z.ZodString;
            address: z.ZodString;
            timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            address: string;
            timelock?: number | null | undefined;
        }, {
            type: string;
            address: string;
            timelock?: number | null | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        index: number;
        value: bigint;
        script: {
            type: "Buffer";
            data: number[];
        };
        token_data: number;
        decoded: {
            type: string;
            address: string;
            timelock?: number | null | undefined;
        };
        token: string;
        tx_id: string;
    }, {
        index: number;
        value: string | number | bigint;
        script: {
            type: "Buffer";
            data: number[];
        };
        token_data: number;
        decoded: {
            type: string;
            address: string;
            timelock?: number | null | undefined;
        };
        token: string;
        tx_id: string;
    }>, "many">;
    outputs: z.ZodArray<z.ZodObject<{
        value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
        token_data: z.ZodNumber;
        script: z.ZodObject<{
            type: z.ZodLiteral<"Buffer">;
            data: z.ZodArray<z.ZodNumber, "many">;
        }, "strip", z.ZodTypeAny, {
            type: "Buffer";
            data: number[];
        }, {
            type: "Buffer";
            data: number[];
        }>;
        decodedScript: z.ZodOptional<z.ZodNullable<z.ZodAny>>;
        token: z.ZodUnion<[z.ZodString, z.ZodLiteral<string>]>;
        locked: z.ZodBoolean;
        index: z.ZodNumber;
        decoded: z.ZodObject<{
            type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            address: z.ZodOptional<z.ZodString>;
            timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            type?: string | null | undefined;
            address?: string | undefined;
            timelock?: number | null | undefined;
        }, {
            type?: string | null | undefined;
            address?: string | undefined;
            timelock?: number | null | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        index: number;
        value: bigint;
        script: {
            type: "Buffer";
            data: number[];
        };
        locked: boolean;
        token_data: number;
        decoded: {
            type?: string | null | undefined;
            address?: string | undefined;
            timelock?: number | null | undefined;
        };
        token: string;
        decodedScript?: any;
    }, {
        index: number;
        value: string | number | bigint;
        script: {
            type: "Buffer";
            data: number[];
        };
        locked: boolean;
        token_data: number;
        decoded: {
            type?: string | null | undefined;
            address?: string | undefined;
            timelock?: number | null | undefined;
        };
        token: string;
        decodedScript?: any;
    }>, "many">;
    height: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    token_name: z.ZodNullable<z.ZodString>;
    token_symbol: z.ZodNullable<z.ZodString>;
    signal_bits: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    nonce: number;
    tx_id: string;
    timestamp: number;
    version: number;
    weight: number;
    inputs: {
        index: number;
        value: bigint;
        script: {
            type: "Buffer";
            data: number[];
        };
        token_data: number;
        decoded: {
            type: string;
            address: string;
            timelock?: number | null | undefined;
        };
        token: string;
        tx_id: string;
    }[];
    outputs: {
        index: number;
        value: bigint;
        script: {
            type: "Buffer";
            data: number[];
        };
        locked: boolean;
        token_data: number;
        decoded: {
            type?: string | null | undefined;
            address?: string | undefined;
            timelock?: number | null | undefined;
        };
        token: string;
        decodedScript?: any;
    }[];
    parents: string[];
    token_name: string | null;
    token_symbol: string | null;
    signal_bits: number;
    voided: boolean;
    height?: number | null | undefined;
}, {
    nonce: number;
    tx_id: string;
    timestamp: number;
    version: number;
    weight: number;
    inputs: {
        index: number;
        value: string | number | bigint;
        script: {
            type: "Buffer";
            data: number[];
        };
        token_data: number;
        decoded: {
            type: string;
            address: string;
            timelock?: number | null | undefined;
        };
        token: string;
        tx_id: string;
    }[];
    outputs: {
        index: number;
        value: string | number | bigint;
        script: {
            type: "Buffer";
            data: number[];
        };
        locked: boolean;
        token_data: number;
        decoded: {
            type?: string | null | undefined;
            address?: string | undefined;
            timelock?: number | null | undefined;
        };
        token: string;
        decodedScript?: any;
    }[];
    parents: string[];
    token_name: string | null;
    token_symbol: string | null;
    signal_bits: number;
    voided: boolean;
    height?: number | null | undefined;
}>;
/**
 * Collection of all wallet API schemas.
 * Used for type validation and documentation of the wallet API.
 */
export declare const walletApiSchemas: {
    addressesResponse: z.ZodObject<z.objectUtil.extendShape<{
        success: z.ZodBoolean;
    }, {
        addresses: z.ZodArray<z.ZodObject<{
            address: z.ZodString;
            index: z.ZodNumber;
            transactions: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            index: number;
            address: string;
            transactions: number;
        }, {
            index: number;
            address: string;
            transactions: number;
        }>, "many">;
    }>, "strip", z.ZodTypeAny, {
        success: boolean;
        addresses: {
            index: number;
            address: string;
            transactions: number;
        }[];
    }, {
        success: boolean;
        addresses: {
            index: number;
            address: string;
            transactions: number;
        }[];
    }>;
    checkAddressesMineResponse: z.ZodObject<z.objectUtil.extendShape<{
        success: z.ZodBoolean;
    }, {
        addresses: z.ZodRecord<z.ZodString, z.ZodBoolean>;
    }>, "strip", z.ZodTypeAny, {
        success: boolean;
        addresses: Record<string, boolean>;
    }, {
        success: boolean;
        addresses: Record<string, boolean>;
    }>;
    newAddressesResponse: z.ZodObject<z.objectUtil.extendShape<{
        success: z.ZodBoolean;
    }, {
        addresses: z.ZodArray<z.ZodObject<{
            address: z.ZodString;
            index: z.ZodNumber;
            addressPath: z.ZodString;
            info: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            index: number;
            address: string;
            addressPath: string;
            info?: string | undefined;
        }, {
            index: number;
            address: string;
            addressPath: string;
            info?: string | undefined;
        }>, "many">;
    }>, "strip", z.ZodTypeAny, {
        success: boolean;
        addresses: {
            index: number;
            address: string;
            addressPath: string;
            info?: string | undefined;
        }[];
    }, {
        success: boolean;
        addresses: {
            index: number;
            address: string;
            addressPath: string;
            info?: string | undefined;
        }[];
    }>;
    tokenDetailsResponse: z.ZodObject<z.objectUtil.extendShape<{
        success: z.ZodBoolean;
    }, {
        details: z.ZodObject<{
            tokenInfo: z.ZodObject<{
                id: z.ZodUnion<[z.ZodString, z.ZodLiteral<string>]>;
                name: z.ZodString;
                symbol: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                symbol: string;
                id: string;
                name: string;
            }, {
                symbol: string;
                id: string;
                name: string;
            }>;
            totalSupply: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            totalTransactions: z.ZodNumber;
            authorities: z.ZodObject<{
                mint: z.ZodBoolean;
                melt: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                mint: boolean;
                melt: boolean;
            }, {
                mint: boolean;
                melt: boolean;
            }>;
        }, "strip", z.ZodTypeAny, {
            authorities: {
                mint: boolean;
                melt: boolean;
            };
            tokenInfo: {
                symbol: string;
                id: string;
                name: string;
            };
            totalSupply: bigint;
            totalTransactions: number;
        }, {
            authorities: {
                mint: boolean;
                melt: boolean;
            };
            tokenInfo: {
                symbol: string;
                id: string;
                name: string;
            };
            totalSupply: string | number | bigint;
            totalTransactions: number;
        }>;
    }>, "strip", z.ZodTypeAny, {
        details: {
            authorities: {
                mint: boolean;
                melt: boolean;
            };
            tokenInfo: {
                symbol: string;
                id: string;
                name: string;
            };
            totalSupply: bigint;
            totalTransactions: number;
        };
        success: boolean;
    }, {
        details: {
            authorities: {
                mint: boolean;
                melt: boolean;
            };
            tokenInfo: {
                symbol: string;
                id: string;
                name: string;
            };
            totalSupply: string | number | bigint;
            totalTransactions: number;
        };
        success: boolean;
    }>;
    balanceResponse: z.ZodObject<z.objectUtil.extendShape<{
        success: z.ZodBoolean;
    }, {
        balances: z.ZodArray<z.ZodObject<{
            token: z.ZodObject<{
                id: z.ZodUnion<[z.ZodString, z.ZodLiteral<string>]>;
                name: z.ZodString;
                symbol: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                symbol: string;
                id: string;
                name: string;
            }, {
                symbol: string;
                id: string;
                name: string;
            }>;
            balance: z.ZodObject<{
                unlocked: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
                locked: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            }, "strip", z.ZodTypeAny, {
                locked: bigint;
                unlocked: bigint;
            }, {
                locked: string | number | bigint;
                unlocked: string | number | bigint;
            }>;
            tokenAuthorities: z.ZodObject<{
                unlocked: z.ZodObject<{
                    mint: z.ZodBoolean;
                    melt: z.ZodBoolean;
                }, "strip", z.ZodTypeAny, {
                    mint: boolean;
                    melt: boolean;
                }, {
                    mint: boolean;
                    melt: boolean;
                }>;
                locked: z.ZodObject<{
                    mint: z.ZodBoolean;
                    melt: z.ZodBoolean;
                }, "strip", z.ZodTypeAny, {
                    mint: boolean;
                    melt: boolean;
                }, {
                    mint: boolean;
                    melt: boolean;
                }>;
            }, "strip", z.ZodTypeAny, {
                locked: {
                    mint: boolean;
                    melt: boolean;
                };
                unlocked: {
                    mint: boolean;
                    melt: boolean;
                };
            }, {
                locked: {
                    mint: boolean;
                    melt: boolean;
                };
                unlocked: {
                    mint: boolean;
                    melt: boolean;
                };
            }>;
            transactions: z.ZodNumber;
            lockExpires: z.ZodNullable<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            balance: {
                locked: bigint;
                unlocked: bigint;
            };
            token: {
                symbol: string;
                id: string;
                name: string;
            };
            transactions: number;
            tokenAuthorities: {
                locked: {
                    mint: boolean;
                    melt: boolean;
                };
                unlocked: {
                    mint: boolean;
                    melt: boolean;
                };
            };
            lockExpires: number | null;
        }, {
            balance: {
                locked: string | number | bigint;
                unlocked: string | number | bigint;
            };
            token: {
                symbol: string;
                id: string;
                name: string;
            };
            transactions: number;
            tokenAuthorities: {
                locked: {
                    mint: boolean;
                    melt: boolean;
                };
                unlocked: {
                    mint: boolean;
                    melt: boolean;
                };
            };
            lockExpires: number | null;
        }>, "many">;
    }>, "strip", z.ZodTypeAny, {
        success: boolean;
        balances: {
            balance: {
                locked: bigint;
                unlocked: bigint;
            };
            token: {
                symbol: string;
                id: string;
                name: string;
            };
            transactions: number;
            tokenAuthorities: {
                locked: {
                    mint: boolean;
                    melt: boolean;
                };
                unlocked: {
                    mint: boolean;
                    melt: boolean;
                };
            };
            lockExpires: number | null;
        }[];
    }, {
        success: boolean;
        balances: {
            balance: {
                locked: string | number | bigint;
                unlocked: string | number | bigint;
            };
            token: {
                symbol: string;
                id: string;
                name: string;
            };
            transactions: number;
            tokenAuthorities: {
                locked: {
                    mint: boolean;
                    melt: boolean;
                };
                unlocked: {
                    mint: boolean;
                    melt: boolean;
                };
            };
            lockExpires: number | null;
        }[];
    }>;
    txProposalCreateResponse: z.ZodObject<z.objectUtil.extendShape<{
        success: z.ZodBoolean;
    }, {
        txProposalId: z.ZodString;
        inputs: z.ZodArray<z.ZodObject<{
            txId: z.ZodString;
            index: z.ZodNumber;
            addressPath: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            index: number;
            txId: string;
            addressPath: string;
        }, {
            index: number;
            txId: string;
            addressPath: string;
        }>, "many">;
    }>, "strip", z.ZodTypeAny, {
        success: boolean;
        inputs: {
            index: number;
            txId: string;
            addressPath: string;
        }[];
        txProposalId: string;
    }, {
        success: boolean;
        inputs: {
            index: number;
            txId: string;
            addressPath: string;
        }[];
        txProposalId: string;
    }>;
    txProposalUpdateResponse: z.ZodObject<z.objectUtil.extendShape<{
        success: z.ZodBoolean;
    }, {
        txProposalId: z.ZodString;
        txHex: z.ZodString;
    }>, "strip", z.ZodTypeAny, {
        success: boolean;
        txProposalId: string;
        txHex: string;
    }, {
        success: boolean;
        txProposalId: string;
        txHex: string;
    }>;
    fullNodeVersionData: z.ZodObject<{
        timestamp: z.ZodNumber;
        version: z.ZodString;
        network: z.ZodString;
        minWeight: z.ZodNumber;
        minTxWeight: z.ZodNumber;
        minTxWeightCoefficient: z.ZodNumber;
        minTxWeightK: z.ZodNumber;
        tokenDepositPercentage: z.ZodNumber;
        rewardSpendMinBlocks: z.ZodNumber;
        maxNumberInputs: z.ZodNumber;
        maxNumberOutputs: z.ZodNumber;
        decimalPlaces: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        genesisBlockHash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        genesisTx1Hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        genesisTx2Hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        timestamp: z.ZodNumber;
        version: z.ZodString;
        network: z.ZodString;
        minWeight: z.ZodNumber;
        minTxWeight: z.ZodNumber;
        minTxWeightCoefficient: z.ZodNumber;
        minTxWeightK: z.ZodNumber;
        tokenDepositPercentage: z.ZodNumber;
        rewardSpendMinBlocks: z.ZodNumber;
        maxNumberInputs: z.ZodNumber;
        maxNumberOutputs: z.ZodNumber;
        decimalPlaces: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        genesisBlockHash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        genesisTx1Hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        genesisTx2Hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        timestamp: z.ZodNumber;
        version: z.ZodString;
        network: z.ZodString;
        minWeight: z.ZodNumber;
        minTxWeight: z.ZodNumber;
        minTxWeightCoefficient: z.ZodNumber;
        minTxWeightK: z.ZodNumber;
        tokenDepositPercentage: z.ZodNumber;
        rewardSpendMinBlocks: z.ZodNumber;
        maxNumberInputs: z.ZodNumber;
        maxNumberOutputs: z.ZodNumber;
        decimalPlaces: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        genesisBlockHash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        genesisTx1Hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        genesisTx2Hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>;
    fullNodeTxResponse: z.ZodObject<z.objectUtil.extendShape<{
        success: z.ZodBoolean;
    }, {
        tx: z.ZodObject<{
            hash: z.ZodString;
            nonce: z.ZodString;
            timestamp: z.ZodNumber;
            version: z.ZodNumber;
            weight: z.ZodNumber;
            signal_bits: z.ZodOptional<z.ZodNumber>;
            parents: z.ZodArray<z.ZodString, "many">;
            inputs: z.ZodArray<z.ZodObject<{
                value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
                token_data: z.ZodNumber;
                script: z.ZodString;
                decoded: z.ZodObject<{
                    type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                    address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                    timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                    value: z.ZodOptional<z.ZodNullable<z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>>>;
                    token_data: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    type?: string | null | undefined;
                    address?: string | null | undefined;
                    value?: bigint | null | undefined;
                    timelock?: number | null | undefined;
                    token_data?: number | null | undefined;
                }, {
                    type?: string | null | undefined;
                    address?: string | null | undefined;
                    value?: string | number | bigint | null | undefined;
                    timelock?: number | null | undefined;
                    token_data?: number | null | undefined;
                }>;
                tx_id: z.ZodString;
                index: z.ZodNumber;
                token: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodLiteral<string>]>>>;
                spent_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                index: number;
                value: bigint;
                script: string;
                token_data: number;
                decoded: {
                    type?: string | null | undefined;
                    address?: string | null | undefined;
                    value?: bigint | null | undefined;
                    timelock?: number | null | undefined;
                    token_data?: number | null | undefined;
                };
                tx_id: string;
                token?: string | null | undefined;
                spent_by?: string | null | undefined;
            }, {
                index: number;
                value: string | number | bigint;
                script: string;
                token_data: number;
                decoded: {
                    type?: string | null | undefined;
                    address?: string | null | undefined;
                    value?: string | number | bigint | null | undefined;
                    timelock?: number | null | undefined;
                    token_data?: number | null | undefined;
                };
                tx_id: string;
                token?: string | null | undefined;
                spent_by?: string | null | undefined;
            }>, "many">;
            outputs: z.ZodArray<z.ZodObject<{
                value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
                token_data: z.ZodNumber;
                script: z.ZodString;
                decoded: z.ZodObject<{
                    type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                    address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                    timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                    value: z.ZodOptional<z.ZodNullable<z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>>>;
                    token_data: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                }, "strip", z.ZodTypeAny, {
                    type?: string | null | undefined;
                    address?: string | null | undefined;
                    value?: bigint | null | undefined;
                    timelock?: number | null | undefined;
                    token_data?: number | null | undefined;
                }, {
                    type?: string | null | undefined;
                    address?: string | null | undefined;
                    value?: string | number | bigint | null | undefined;
                    timelock?: number | null | undefined;
                    token_data?: number | null | undefined;
                }>;
                address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                token: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodLiteral<string>]>>>;
                authorities: z.ZodOptional<z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>>;
                timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                value: bigint;
                script: string;
                token_data: number;
                decoded: {
                    type?: string | null | undefined;
                    address?: string | null | undefined;
                    value?: bigint | null | undefined;
                    timelock?: number | null | undefined;
                    token_data?: number | null | undefined;
                };
                address?: string | null | undefined;
                timelock?: number | null | undefined;
                authorities?: bigint | undefined;
                token?: string | null | undefined;
            }, {
                value: string | number | bigint;
                script: string;
                token_data: number;
                decoded: {
                    type?: string | null | undefined;
                    address?: string | null | undefined;
                    value?: string | number | bigint | null | undefined;
                    timelock?: number | null | undefined;
                    token_data?: number | null | undefined;
                };
                address?: string | null | undefined;
                timelock?: number | null | undefined;
                authorities?: string | number | bigint | undefined;
                token?: string | null | undefined;
            }>, "many">;
            tokens: z.ZodArray<z.ZodObject<{
                uid: z.ZodString;
                name: z.ZodString;
                symbol: z.ZodString;
                amount: z.ZodOptional<z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>>;
            }, "strip", z.ZodTypeAny, {
                symbol: string;
                name: string;
                uid: string;
                amount?: bigint | undefined;
            }, {
                symbol: string;
                name: string;
                uid: string;
                amount?: string | number | bigint | undefined;
            }>, "many">;
            token_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            token_symbol: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            nc_id: z.ZodOptional<z.ZodString>;
            nc_seqnum: z.ZodOptional<z.ZodNumber>;
            nc_blueprint_id: z.ZodOptional<z.ZodString>;
            nc_method: z.ZodOptional<z.ZodString>;
            nc_args: z.ZodOptional<z.ZodString>;
            nc_address: z.ZodOptional<z.ZodString>;
            nc_context: z.ZodOptional<z.ZodObject<{
                actions: z.ZodArray<z.ZodObject<{
                    type: z.ZodString;
                    token_uid: z.ZodString;
                    amount: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    type: string;
                    token_uid: string;
                    amount: number;
                }, {
                    type: string;
                    token_uid: string;
                    amount: number;
                }>, "many">;
                address: z.ZodString;
                timestamp: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                address: string;
                actions: {
                    type: string;
                    token_uid: string;
                    amount: number;
                }[];
                timestamp: number;
            }, {
                address: string;
                actions: {
                    type: string;
                    token_uid: string;
                    amount: number;
                }[];
                timestamp: number;
            }>>;
            raw: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            raw: string;
            nonce: string;
            hash: string;
            tokens: {
                symbol: string;
                name: string;
                uid: string;
                amount?: bigint | undefined;
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
                    type?: string | null | undefined;
                    address?: string | null | undefined;
                    value?: bigint | null | undefined;
                    timelock?: number | null | undefined;
                    token_data?: number | null | undefined;
                };
                tx_id: string;
                token?: string | null | undefined;
                spent_by?: string | null | undefined;
            }[];
            outputs: {
                value: bigint;
                script: string;
                token_data: number;
                decoded: {
                    type?: string | null | undefined;
                    address?: string | null | undefined;
                    value?: bigint | null | undefined;
                    timelock?: number | null | undefined;
                    token_data?: number | null | undefined;
                };
                address?: string | null | undefined;
                timelock?: number | null | undefined;
                authorities?: bigint | undefined;
                token?: string | null | undefined;
            }[];
            parents: string[];
            token_name?: string | null | undefined;
            token_symbol?: string | null | undefined;
            nc_id?: string | undefined;
            nc_blueprint_id?: string | undefined;
            nc_method?: string | undefined;
            nc_args?: string | undefined;
            nc_address?: string | undefined;
            nc_context?: {
                address: string;
                actions: {
                    type: string;
                    token_uid: string;
                    amount: number;
                }[];
                timestamp: number;
            } | undefined;
            nc_seqnum?: number | undefined;
            signal_bits?: number | undefined;
        }, {
            raw: string;
            nonce: string;
            hash: string;
            tokens: {
                symbol: string;
                name: string;
                uid: string;
                amount?: string | number | bigint | undefined;
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
                    type?: string | null | undefined;
                    address?: string | null | undefined;
                    value?: string | number | bigint | null | undefined;
                    timelock?: number | null | undefined;
                    token_data?: number | null | undefined;
                };
                tx_id: string;
                token?: string | null | undefined;
                spent_by?: string | null | undefined;
            }[];
            outputs: {
                value: string | number | bigint;
                script: string;
                token_data: number;
                decoded: {
                    type?: string | null | undefined;
                    address?: string | null | undefined;
                    value?: string | number | bigint | null | undefined;
                    timelock?: number | null | undefined;
                    token_data?: number | null | undefined;
                };
                address?: string | null | undefined;
                timelock?: number | null | undefined;
                authorities?: string | number | bigint | undefined;
                token?: string | null | undefined;
            }[];
            parents: string[];
            token_name?: string | null | undefined;
            token_symbol?: string | null | undefined;
            nc_id?: string | undefined;
            nc_blueprint_id?: string | undefined;
            nc_method?: string | undefined;
            nc_args?: string | undefined;
            nc_address?: string | undefined;
            nc_context?: {
                address: string;
                actions: {
                    type: string;
                    token_uid: string;
                    amount: number;
                }[];
                timestamp: number;
            } | undefined;
            nc_seqnum?: number | undefined;
            signal_bits?: number | undefined;
        }>;
        meta: z.ZodObject<{
            hash: z.ZodString;
            received_by: z.ZodArray<z.ZodString, "many">;
            children: z.ZodArray<z.ZodString, "many">;
            conflict_with: z.ZodArray<z.ZodString, "many">;
            first_block: z.ZodNullable<z.ZodString>;
            height: z.ZodNumber;
            voided_by: z.ZodArray<z.ZodString, "many">;
            spent_outputs: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodArray<z.ZodString, "many">], null>, "many">;
            received_timestamp: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            is_voided: z.ZodOptional<z.ZodBoolean>;
            verification_status: z.ZodOptional<z.ZodString>;
            twins: z.ZodArray<z.ZodString, "many">;
            accumulated_weight: z.ZodNumber;
            score: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            height: number;
            children: string[];
            hash: string;
            first_block: string | null;
            spent_outputs: [number, string[]][];
            received_by: string[];
            conflict_with: string[];
            voided_by: string[];
            twins: string[];
            accumulated_weight: number;
            score: number;
            is_voided?: boolean | undefined;
            received_timestamp?: number | null | undefined;
            verification_status?: string | undefined;
        }, {
            height: number;
            children: string[];
            hash: string;
            first_block: string | null;
            spent_outputs: [number, string[]][];
            received_by: string[];
            conflict_with: string[];
            voided_by: string[];
            twins: string[];
            accumulated_weight: number;
            score: number;
            is_voided?: boolean | undefined;
            received_timestamp?: number | null | undefined;
            verification_status?: string | undefined;
        }>;
        message: z.ZodOptional<z.ZodString>;
        spent_outputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }>, "strip", z.ZodTypeAny, {
        meta: {
            height: number;
            children: string[];
            hash: string;
            first_block: string | null;
            spent_outputs: [number, string[]][];
            received_by: string[];
            conflict_with: string[];
            voided_by: string[];
            twins: string[];
            accumulated_weight: number;
            score: number;
            is_voided?: boolean | undefined;
            received_timestamp?: number | null | undefined;
            verification_status?: string | undefined;
        };
        success: boolean;
        tx: {
            raw: string;
            nonce: string;
            hash: string;
            tokens: {
                symbol: string;
                name: string;
                uid: string;
                amount?: bigint | undefined;
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
                    type?: string | null | undefined;
                    address?: string | null | undefined;
                    value?: bigint | null | undefined;
                    timelock?: number | null | undefined;
                    token_data?: number | null | undefined;
                };
                tx_id: string;
                token?: string | null | undefined;
                spent_by?: string | null | undefined;
            }[];
            outputs: {
                value: bigint;
                script: string;
                token_data: number;
                decoded: {
                    type?: string | null | undefined;
                    address?: string | null | undefined;
                    value?: bigint | null | undefined;
                    timelock?: number | null | undefined;
                    token_data?: number | null | undefined;
                };
                address?: string | null | undefined;
                timelock?: number | null | undefined;
                authorities?: bigint | undefined;
                token?: string | null | undefined;
            }[];
            parents: string[];
            token_name?: string | null | undefined;
            token_symbol?: string | null | undefined;
            nc_id?: string | undefined;
            nc_blueprint_id?: string | undefined;
            nc_method?: string | undefined;
            nc_args?: string | undefined;
            nc_address?: string | undefined;
            nc_context?: {
                address: string;
                actions: {
                    type: string;
                    token_uid: string;
                    amount: number;
                }[];
                timestamp: number;
            } | undefined;
            nc_seqnum?: number | undefined;
            signal_bits?: number | undefined;
        };
        message?: string | undefined;
        spent_outputs?: Record<string, string> | undefined;
    }, {
        meta: {
            height: number;
            children: string[];
            hash: string;
            first_block: string | null;
            spent_outputs: [number, string[]][];
            received_by: string[];
            conflict_with: string[];
            voided_by: string[];
            twins: string[];
            accumulated_weight: number;
            score: number;
            is_voided?: boolean | undefined;
            received_timestamp?: number | null | undefined;
            verification_status?: string | undefined;
        };
        success: boolean;
        tx: {
            raw: string;
            nonce: string;
            hash: string;
            tokens: {
                symbol: string;
                name: string;
                uid: string;
                amount?: string | number | bigint | undefined;
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
                    type?: string | null | undefined;
                    address?: string | null | undefined;
                    value?: string | number | bigint | null | undefined;
                    timelock?: number | null | undefined;
                    token_data?: number | null | undefined;
                };
                tx_id: string;
                token?: string | null | undefined;
                spent_by?: string | null | undefined;
            }[];
            outputs: {
                value: string | number | bigint;
                script: string;
                token_data: number;
                decoded: {
                    type?: string | null | undefined;
                    address?: string | null | undefined;
                    value?: string | number | bigint | null | undefined;
                    timelock?: number | null | undefined;
                    token_data?: number | null | undefined;
                };
                address?: string | null | undefined;
                timelock?: number | null | undefined;
                authorities?: string | number | bigint | undefined;
                token?: string | null | undefined;
            }[];
            parents: string[];
            token_name?: string | null | undefined;
            token_symbol?: string | null | undefined;
            nc_id?: string | undefined;
            nc_blueprint_id?: string | undefined;
            nc_method?: string | undefined;
            nc_args?: string | undefined;
            nc_address?: string | undefined;
            nc_context?: {
                address: string;
                actions: {
                    type: string;
                    token_uid: string;
                    amount: number;
                }[];
                timestamp: number;
            } | undefined;
            nc_seqnum?: number | undefined;
            signal_bits?: number | undefined;
        };
        message?: string | undefined;
        spent_outputs?: Record<string, string> | undefined;
    }>;
    fullNodeTxConfirmationDataResponse: z.ZodObject<z.objectUtil.extendShape<{
        success: z.ZodBoolean;
    }, {
        accumulated_weight: z.ZodNumber;
        accumulated_bigger: z.ZodBoolean;
        stop_value: z.ZodNumber;
        confirmation_level: z.ZodNumber;
    }>, "strip", z.ZodTypeAny, {
        success: boolean;
        accumulated_weight: number;
        accumulated_bigger: boolean;
        stop_value: number;
        confirmation_level: number;
    }, {
        success: boolean;
        accumulated_weight: number;
        accumulated_bigger: boolean;
        stop_value: number;
        confirmation_level: number;
    }>;
    walletStatusResponse: z.ZodObject<z.objectUtil.extendShape<{
        success: z.ZodBoolean;
    }, {
        status: z.ZodObject<{
            walletId: z.ZodString;
            xpubkey: z.ZodString;
            status: z.ZodString;
            maxGap: z.ZodNumber;
            createdAt: z.ZodNumber;
            readyAt: z.ZodNullable<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            status: string;
            xpubkey: string;
            walletId: string;
            maxGap: number;
            createdAt: number;
            readyAt: number | null;
        }, {
            status: string;
            xpubkey: string;
            walletId: string;
            maxGap: number;
            createdAt: number;
            readyAt: number | null;
        }>;
        error: z.ZodOptional<z.ZodString>;
    }>, "strip", z.ZodTypeAny, {
        success: boolean;
        status: {
            status: string;
            xpubkey: string;
            walletId: string;
            maxGap: number;
            createdAt: number;
            readyAt: number | null;
        };
        error?: string | undefined;
    }, {
        success: boolean;
        status: {
            status: string;
            xpubkey: string;
            walletId: string;
            maxGap: number;
            createdAt: number;
            readyAt: number | null;
        };
        error?: string | undefined;
    }>;
    tokensResponse: z.ZodObject<z.objectUtil.extendShape<{
        success: z.ZodBoolean;
    }, {
        tokens: z.ZodArray<z.ZodString, "many">;
    }>, "strip", z.ZodTypeAny, {
        success: boolean;
        tokens: string[];
    }, {
        success: boolean;
        tokens: string[];
    }>;
    historyResponse: z.ZodObject<z.objectUtil.extendShape<{
        success: z.ZodBoolean;
    }, {
        history: z.ZodArray<z.ZodObject<{
            txId: z.ZodString;
            balance: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            timestamp: z.ZodNumber;
            voided: z.ZodEffects<z.ZodNumber, boolean, number>;
            version: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            balance: bigint;
            timestamp: number;
            version: number;
            txId: string;
            voided: boolean;
        }, {
            balance: string | number | bigint;
            timestamp: number;
            version: number;
            txId: string;
            voided: number;
        }>, "many">;
    }>, "strip", z.ZodTypeAny, {
        success: boolean;
        history: {
            balance: bigint;
            timestamp: number;
            version: number;
            txId: string;
            voided: boolean;
        }[];
    }, {
        success: boolean;
        history: {
            balance: string | number | bigint;
            timestamp: number;
            version: number;
            txId: string;
            voided: number;
        }[];
    }>;
    txOutputResponse: z.ZodObject<z.objectUtil.extendShape<{
        success: z.ZodBoolean;
    }, {
        txOutputs: z.ZodArray<z.ZodObject<{
            txId: z.ZodString;
            index: z.ZodNumber;
            tokenId: z.ZodString;
            address: z.ZodString;
            value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            authorities: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            timelock: z.ZodNullable<z.ZodNumber>;
            heightlock: z.ZodNullable<z.ZodNumber>;
            locked: z.ZodBoolean;
            addressPath: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            index: number;
            address: string;
            value: bigint;
            timelock: number | null;
            locked: boolean;
            authorities: bigint;
            txId: string;
            addressPath: string;
            tokenId: string;
            heightlock: number | null;
        }, {
            index: number;
            address: string;
            value: string | number | bigint;
            timelock: number | null;
            locked: boolean;
            authorities: string | number | bigint;
            txId: string;
            addressPath: string;
            tokenId: string;
            heightlock: number | null;
        }>, "many">;
    }>, "strip", z.ZodTypeAny, {
        success: boolean;
        txOutputs: {
            index: number;
            address: string;
            value: bigint;
            timelock: number | null;
            locked: boolean;
            authorities: bigint;
            txId: string;
            addressPath: string;
            tokenId: string;
            heightlock: number | null;
        }[];
    }, {
        success: boolean;
        txOutputs: {
            index: number;
            address: string;
            value: string | number | bigint;
            timelock: number | null;
            locked: boolean;
            authorities: string | number | bigint;
            txId: string;
            addressPath: string;
            tokenId: string;
            heightlock: number | null;
        }[];
    }>;
    authTokenResponse: z.ZodObject<z.objectUtil.extendShape<{
        success: z.ZodBoolean;
    }, {
        token: z.ZodString;
    }>, "strip", z.ZodTypeAny, {
        success: boolean;
        token: string;
    }, {
        success: boolean;
        token: string;
    }>;
    txByIdResponse: z.ZodObject<z.objectUtil.extendShape<{
        success: z.ZodBoolean;
    }, {
        txTokens: z.ZodArray<z.ZodObject<{
            txId: z.ZodString;
            timestamp: z.ZodNumber;
            version: z.ZodNumber;
            voided: z.ZodBoolean;
            height: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            weight: z.ZodNumber;
            balance: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            tokenId: z.ZodString;
            tokenName: z.ZodString;
            tokenSymbol: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            balance: bigint;
            timestamp: number;
            version: number;
            weight: number;
            txId: string;
            voided: boolean;
            tokenId: string;
            tokenName: string;
            tokenSymbol: string;
            height?: number | null | undefined;
        }, {
            balance: string | number | bigint;
            timestamp: number;
            version: number;
            weight: number;
            txId: string;
            voided: boolean;
            tokenId: string;
            tokenName: string;
            tokenSymbol: string;
            height?: number | null | undefined;
        }>, "many">;
    }>, "strip", z.ZodTypeAny, {
        success: boolean;
        txTokens: {
            balance: bigint;
            timestamp: number;
            version: number;
            weight: number;
            txId: string;
            voided: boolean;
            tokenId: string;
            tokenName: string;
            tokenSymbol: string;
            height?: number | null | undefined;
        }[];
    }, {
        success: boolean;
        txTokens: {
            balance: string | number | bigint;
            timestamp: number;
            version: number;
            weight: number;
            txId: string;
            voided: boolean;
            tokenId: string;
            tokenName: string;
            tokenSymbol: string;
            height?: number | null | undefined;
        }[];
    }>;
    wsTransaction: z.ZodObject<{
        tx_id: z.ZodString;
        nonce: z.ZodNumber;
        timestamp: z.ZodNumber;
        version: z.ZodNumber;
        voided: z.ZodBoolean;
        weight: z.ZodNumber;
        parents: z.ZodArray<z.ZodString, "many">;
        inputs: z.ZodArray<z.ZodObject<{
            tx_id: z.ZodString;
            index: z.ZodNumber;
            value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            token_data: z.ZodNumber;
            script: z.ZodObject<{
                type: z.ZodLiteral<"Buffer">;
                data: z.ZodArray<z.ZodNumber, "many">;
            }, "strip", z.ZodTypeAny, {
                type: "Buffer";
                data: number[];
            }, {
                type: "Buffer";
                data: number[];
            }>;
            token: z.ZodUnion<[z.ZodString, z.ZodLiteral<string>]>;
            decoded: z.ZodObject<{
                type: z.ZodString;
                address: z.ZodString;
                timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                type: string;
                address: string;
                timelock?: number | null | undefined;
            }, {
                type: string;
                address: string;
                timelock?: number | null | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            index: number;
            value: bigint;
            script: {
                type: "Buffer";
                data: number[];
            };
            token_data: number;
            decoded: {
                type: string;
                address: string;
                timelock?: number | null | undefined;
            };
            token: string;
            tx_id: string;
        }, {
            index: number;
            value: string | number | bigint;
            script: {
                type: "Buffer";
                data: number[];
            };
            token_data: number;
            decoded: {
                type: string;
                address: string;
                timelock?: number | null | undefined;
            };
            token: string;
            tx_id: string;
        }>, "many">;
        outputs: z.ZodArray<z.ZodObject<{
            value: z.ZodPipeline<z.ZodUnion<[z.ZodUnion<[z.ZodBigInt, z.ZodNumber]>, z.ZodString]>, z.ZodBigInt>;
            token_data: z.ZodNumber;
            script: z.ZodObject<{
                type: z.ZodLiteral<"Buffer">;
                data: z.ZodArray<z.ZodNumber, "many">;
            }, "strip", z.ZodTypeAny, {
                type: "Buffer";
                data: number[];
            }, {
                type: "Buffer";
                data: number[];
            }>;
            decodedScript: z.ZodOptional<z.ZodNullable<z.ZodAny>>;
            token: z.ZodUnion<[z.ZodString, z.ZodLiteral<string>]>;
            locked: z.ZodBoolean;
            index: z.ZodNumber;
            decoded: z.ZodObject<{
                type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                address: z.ZodOptional<z.ZodString>;
                timelock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            }, "strip", z.ZodTypeAny, {
                type?: string | null | undefined;
                address?: string | undefined;
                timelock?: number | null | undefined;
            }, {
                type?: string | null | undefined;
                address?: string | undefined;
                timelock?: number | null | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            index: number;
            value: bigint;
            script: {
                type: "Buffer";
                data: number[];
            };
            locked: boolean;
            token_data: number;
            decoded: {
                type?: string | null | undefined;
                address?: string | undefined;
                timelock?: number | null | undefined;
            };
            token: string;
            decodedScript?: any;
        }, {
            index: number;
            value: string | number | bigint;
            script: {
                type: "Buffer";
                data: number[];
            };
            locked: boolean;
            token_data: number;
            decoded: {
                type?: string | null | undefined;
                address?: string | undefined;
                timelock?: number | null | undefined;
            };
            token: string;
            decodedScript?: any;
        }>, "many">;
        height: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        token_name: z.ZodNullable<z.ZodString>;
        token_symbol: z.ZodNullable<z.ZodString>;
        signal_bits: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        nonce: number;
        tx_id: string;
        timestamp: number;
        version: number;
        weight: number;
        inputs: {
            index: number;
            value: bigint;
            script: {
                type: "Buffer";
                data: number[];
            };
            token_data: number;
            decoded: {
                type: string;
                address: string;
                timelock?: number | null | undefined;
            };
            token: string;
            tx_id: string;
        }[];
        outputs: {
            index: number;
            value: bigint;
            script: {
                type: "Buffer";
                data: number[];
            };
            locked: boolean;
            token_data: number;
            decoded: {
                type?: string | null | undefined;
                address?: string | undefined;
                timelock?: number | null | undefined;
            };
            token: string;
            decodedScript?: any;
        }[];
        parents: string[];
        token_name: string | null;
        token_symbol: string | null;
        signal_bits: number;
        voided: boolean;
        height?: number | null | undefined;
    }, {
        nonce: number;
        tx_id: string;
        timestamp: number;
        version: number;
        weight: number;
        inputs: {
            index: number;
            value: string | number | bigint;
            script: {
                type: "Buffer";
                data: number[];
            };
            token_data: number;
            decoded: {
                type: string;
                address: string;
                timelock?: number | null | undefined;
            };
            token: string;
            tx_id: string;
        }[];
        outputs: {
            index: number;
            value: string | number | bigint;
            script: {
                type: "Buffer";
                data: number[];
            };
            locked: boolean;
            token_data: number;
            decoded: {
                type?: string | null | undefined;
                address?: string | undefined;
                timelock?: number | null | undefined;
            };
            token: string;
            decodedScript?: any;
        }[];
        parents: string[];
        token_name: string | null;
        token_symbol: string | null;
        signal_bits: number;
        voided: boolean;
        height?: number | null | undefined;
    }>;
};
//# sourceMappingURL=walletApi.d.ts.map