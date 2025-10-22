- Feature Name: `batched_rpc_requests`
- Start Date: 2025-10-02
- RFC PR: [hathor-labs/hathor-rpc-lib#0000](https://github.com/hathor-labs/hathor-rpc-lib/pull/0000)
- Issue: [hathor-labs/hathor-rpc-lib#0000](https://github.com/hathor-labs/hathor-rpc-lib/issues/0000)

# Summary
[summary]: #summary

A new `htr_batchRequests` RPC method that allows dApps to execute multiple blockchain operations (transactions, token creation, signatures) with a single user approval and PIN entry, significantly improving user experience by reducing approval fatigue while maintaining security.

# Motivation
[motivation]: #motivation

## The Problem

Currently, each RPC method that performs a write operation requires separate user interactions:

1. **Operation-specific confirmation prompt** - User must review and approve each operation
2. **PIN confirmation prompt** - User must enter their PIN for each operation
3. **Loading states** - User must wait through separate loading indicators

This creates severe UX problems for common dApp workflows:

### Use Case 1: Multi-Recipient Payments
A payroll dApp needs to send tokens to 10 employees. Currently:
- User sees 10 separate transaction approval prompts
- User enters PIN 10 times
- User waits through 10 loading states
- Total time: ~2-3 minutes of clicking and typing

### Use Case 2: Token Launch Workflow
A dApp helps users launch a new token with initial distribution:
1. Create the custom token → approval + PIN
2. Send tokens to treasury address → approval + PIN
3. Send tokens to liquidity pool → approval + PIN
4. Sign token metadata for registry → approval + PIN

Total: 4 approvals, 4 PIN entries, frustrating experience

### Use Case 3: DeFi Swap with Oracle
A DeFi protocol needs to:
1. Sign oracle data for price feed → approval + PIN
2. Execute nano contract swap → approval + PIN
3. Send result to user's address → approval + PIN

Each step interrupts the user flow with approvals.

### Use Case 4: DApp Initialization
When a user connects to a dApp, it needs to:
1. Get user's address → approval (privacy consent)
2. Get balance for 3 tokens → approval (privacy consent)
3. Get UTXOs for transaction preparation → approval (privacy consent)

Currently: 3 separate privacy consent approvals. With batching: 1 approval for all read operations.

## Current Architecture Pain Points

Our RPC architecture has these characteristics:

**Trigger System**: Each operation has unique trigger types:
- `SendTransactionConfirmationPrompt`
- `CreateTokenConfirmationPrompt`
- `SendNanoContractTxConfirmationPrompt`
- `SignWithAddressConfirmationPrompt`
- `SignOracleDataConfirmationPrompt`
- + corresponding loading triggers

**PIN Handling**: Every operation independently:
1. Requests PIN via `PinConfirmationPrompt`
2. Uses PIN for signing/encryption
3. Clears PIN from memory
4. Next operation repeats steps 1-3

**No Coordination**: Operations cannot be grouped or coordinated, forcing dApps to:
- Chain multiple RPC calls sequentially
- Handle approval rejection at each step
- Manage partial failure states manually
- Provide poor UX to end users

## Why This Matters

**User Experience**: Approval fatigue is a real problem. Users either:
- Abandon complex workflows due to repetitive approvals
- Blindly approve without reading (security risk)
- Develop negative perception of blockchain UX

**Developer Experience**: dApp developers must:
- Write complex state machines for multi-step flows
- Handle numerous edge cases (rejection at step N)
- Build custom UIs to explain the approval burden
- Often simplify features to avoid approval overhead

**Competitive Position**: Other blockchain wallets have solved this:
- MetaMask supports batched transactions
- WalletConnect has batch call support
- Phantom wallet bundles Solana transactions

Hathor needs feature parity to enable sophisticated dApps.

# Guide-level explanation
[guide-level-explanation]: #guide-level-explanation

## Concept: Batch Requests

A **batch request** is a single RPC call that bundles multiple operations together. Think of it as a shopping cart for blockchain operations - you add all the items you need, then checkout once.

## Basic Usage

### For dApp Developers

Instead of making multiple RPC calls:

```javascript
// ❌ OLD WAY: Multiple approvals
async function sendToMultipleRecipients(recipients) {
  for (const recipient of recipients) {
    await wallet.request({
      method: 'htr_sendTransaction',
      params: {
        network: 'mainnet',
        outputs: [{
          address: recipient.address,
          value: recipient.amount,
        }]
      }
    });
    // User approves and enters PIN for EACH iteration 😫
  }
}
```

You make a single batch request:

```javascript
// ✅ NEW WAY: Single approval
async function sendToMultipleRecipients(recipients) {
  const batchRequest = {
    method: 'htr_batchRequests',
    params: {
      network: 'mainnet',
      errorHandling: 'continue-on-error',
      requests: recipients.map((recipient, i) => ({
        id: `payment-${i}`,
        method: 'htr_sendTransaction',
        params: {
          network: 'mainnet',
          outputs: [{
            address: recipient.address,
            value: recipient.amount,
          }]
        }
      }))
    }
  };

  const result = await wallet.request(batchRequest);

  // Check results
  result.response.results.forEach(result => {
    if (result.status === 'success') {
      console.log(`✓ Payment ${result.id} succeeded`);
    } else if (result.status === 'failed') {
      console.log(`✗ Payment ${result.id} failed:`, result.error.message);
    }
  });
}
```

**User sees**: One approval screen showing all 10 payments, enters PIN once, done! 🎉

## Request Structure

Every batch request has three parts:

### 1. Network (required)
All operations in a batch must use the same network.

```typescript
{
  network: 'mainnet' // or 'testnet'
}
```

### 2. Requests Array (required)
List of operations to execute, each with:
- `id` - Unique identifier for tracking
- `method` - Which RPC method to call
- `params` - Parameters for that method

```typescript
{
  requests: [
    {
      id: 'operation-1',
      method: 'htr_sendTransaction',
      params: { /* transaction params */ }
    },
    {
      id: 'operation-2',
      method: 'htr_createToken',
      params: { /* token params */ }
    }
  ]
}
```

### 3. Error Handling (optional)
How to handle failures:

```typescript
{
  errorHandling: 'fail-fast' // Stop on first error (default)
  // OR
  errorHandling: 'continue-on-error' // Try all operations
}
```

## Complete Example: Token Launch

```javascript
const result = await wallet.request({
  method: 'htr_batchRequests',
  params: {
    network: 'mainnet',
    errorHandling: 'continue-on-error',
    requests: [
      // 1. Create the token
      {
        id: 'create-token',
        method: 'htr_createToken',
        params: {
          network: 'mainnet',
          name: 'Awesome Token',
          symbol: 'AWE',
          amount: '1000000'
        }
      },

      // 2. Send to treasury
      {
        id: 'send-to-treasury',
        method: 'htr_sendTransaction',
        params: {
          network: 'mainnet',
          outputs: [{
            address: 'HVP...treasury',
            value: '500000',
            token: '${create-token.hash}' // Future feature
          }]
        }
      },

      // 3. Sign metadata
      {
        id: 'sign-metadata',
        method: 'htr_signWithAddress',
        params: {
          network: 'mainnet',
          message: JSON.stringify({
            name: 'Awesome Token',
            website: 'https://awesome.token'
          }),
          addressIndex: 0
        }
      }
    ]
  }
});

// Handle results
if (result.response.status === 'success') {
  console.log('All operations succeeded! 🎉');
} else if (result.response.status === 'partial-success') {
  console.log('Some operations failed ⚠️');
  // Check which ones failed
  const failures = result.response.results.filter(r => r.status === 'failed');
  failures.forEach(f => {
    console.error(`${f.id} failed:`, f.error.message);
  });
}
```

## Example: Mixed Read and Write Operations

```javascript
// DApp wants to check balance, then send tokens
const result = await wallet.request({
  method: 'htr_batchRequests',
  params: {
    network: 'mainnet',
    errorHandling: 'fail-fast',
    requests: [
      // 1. Get user's address (read - requires approval)
      {
        id: 'get-address',
        method: 'htr_getAddress',
        params: {
          network: 'mainnet',
          type: 'first_empty'
        }
      },

      // 2. Get HTR balance (read - requires approval)
      {
        id: 'get-balance',
        method: 'htr_getBalance',
        params: {
          network: 'mainnet',
          tokens: ['00'] // HTR
        }
      },

      // 3. Send transaction (write - requires approval + PIN)
      {
        id: 'send-tx',
        method: 'htr_sendTransaction',
        params: {
          network: 'mainnet',
          outputs: [{
            address: 'HVP...recipient',
            value: '1000',
            token: '00'
          }]
        }
      }
    ]
  }
});

// User sees:
// - Single approval showing all 3 operations
// - One PIN entry (because there's a write operation)
// Result: 3 operations approved with 1 click + 1 PIN entry instead of 3 approvals + 1 PIN
```

## Response Structure

The response contains:

```typescript
{
  type: 'BatchRequestsResponse',
  response: {
    status: 'success' | 'partial-success' | 'failed',
    results: [
      {
        id: 'operation-1',
        status: 'success',
        response: { /* operation result */ }
      },
      {
        id: 'operation-2',
        status: 'failed',
        error: {
          code: 'INSUFFICIENT_FUNDS',
          message: 'Insufficient amount of tokens'
        }
      },
      {
        id: 'operation-3',
        status: 'skipped' // Only in fail-fast mode
      }
    ]
  }
}
```

## User Experience

### What Users See

**Step 1: Batch Approval Screen**
```
┌─────────────────────────────────────────┐
│ Batch Request from dapp.example.com     │
├─────────────────────────────────────────┤
│ You're about to execute 3 operations:   │
│                                         │
│ 1. ✉️  Send Transaction                 │
│    • Send 1000 HTR to HVP...            │
│    • Fee: ~0.01 HTR                     │
│                                         │
│ 2. 🪙 Create Token                      │
│    • Name: Awesome Token                │
│    • Symbol: AWESOM                     │
│    • Amount: 1,000,000                  │
│                                         │
│ 3. ✍️  Sign Message                      │
│    • Message: "Token metadata..."       │
│    • Address: HVP... (index 0)          │
│                                         │
│ ⚙️  Error handling: Continue on error   │
│                                         │
│ [Reject]              [Approve]         │
└─────────────────────────────────────────┘
```

**Step 2: PIN Entry** (same as current)
```
┌─────────────────────────────────────────┐
│ Enter your PIN                          │
│                                         │
│ [●][●][●][●][●][●]                      │
│                                         │
│         [1][2][3]                       │
│         [4][5][6]                       │
│         [7][8][9]                       │
│         [←][0][✓]                       │
└─────────────────────────────────────────┘
```

**Step 3: Progress Indicator**
```
┌─────────────────────────────────────────┐
│ Executing Batch Request                 │
├─────────────────────────────────────────┤
│ Progress: 2 of 3 complete               │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░ 67%       │
│                                         │
│ ✓ Send Transaction                      │
│ ✓ Create Token                          │
│ ⏳ Sign Message...                       │
└─────────────────────────────────────────┘
```

**Step 4: Results**
```
┌─────────────────────────────────────────┐
│ Batch Complete                          │
│ Status: All operations successful ✓     │
├─────────────────────────────────────────┤
│ ✓ Send Transaction                      │
│   Hash: 0x123...                        │
│                                         │
│ ✓ Create Token                          │
│   Token ID: 0xabc...                    │
│                                         │
│ ✓ Sign Message                          │
│   Signature: 0x456...                   │
│                                         │
│            [Close]                      │
└─────────────────────────────────────────┘
```

## Error Handling Modes

### Fail-Fast (Default)
Stop at the first error:

```
Operation 1: ✓ Success
Operation 2: ✗ Failed  <-- Stop here
Operation 3: ⊘ Skipped
Operation 4: ⊘ Skipped
```

**Use when:**
- Operations depend on each other
- You want "all-or-nothing" behavior
- It's the safe default

### Continue-on-Error
Try all operations regardless of failures:

```
Operation 1: ✓ Success
Operation 2: ✗ Failed  <-- Continue anyway
Operation 3: ✓ Success
Operation 4: ✓ Success
```

**Use when:**
- Operations are independent
- You want to maximize success
- Failures are acceptable for some operations

## Supported Operations

**Write Operations (require approval + PIN):**
- ✅ `htr_sendTransaction` - Send tokens
- ✅ `htr_createToken` - Create custom tokens
- ✅ `htr_sendNanoContractTx` - Execute nano contracts
- ✅ `htr_signWithAddress` - Sign messages
- ✅ `htr_signOracleData` - Sign oracle data

**Read Operations (require approval, no PIN):**
- ✅ `htr_getAddress` - Get wallet address (privacy consent required)
- ✅ `htr_getBalance` - Get token balances (privacy consent required)
- ✅ `htr_getUtxos` - Get UTXOs (privacy consent required)

**Special Operations (require approval, no PIN):**
- ✅ `htr_changeNetwork` - Change wallet network (security consent required)

**Not Supported:**
- ❌ `htr_getConnectedNetwork` - No approval needed, can be called directly

## Migration Guide

### For Existing dApps

Batching is **100% backwards compatible**. Your existing code continues to work:

```javascript
// This still works exactly as before
await wallet.request({
  method: 'htr_sendTransaction',
  params: { /* ... */ }
});
```

Migrate incrementally:
1. Identify multi-step workflows in your dApp
2. Replace sequential RPC calls with batch requests
3. Update UI to explain the batched approval
4. Test thoroughly

### Common Patterns to Batch

**Pattern 1: Multiple payments**
```javascript
// Before: N approvals
for (const payment of payments) {
  await wallet.request({ method: 'htr_sendTransaction', ... });
}

// After: 1 approval
await wallet.request({
  method: 'htr_batchRequests',
  params: {
    requests: payments.map(p => ({
      id: p.id,
      method: 'htr_sendTransaction',
      params: p.params
    }))
  }
});
```

**Pattern 2: Setup workflows**
```javascript
// Before: Multiple approvals
await wallet.request({ method: 'htr_createToken', ... });
await wallet.request({ method: 'htr_sendTransaction', ... });
await wallet.request({ method: 'htr_signWithAddress', ... });

// After: Single approval
await wallet.request({
  method: 'htr_batchRequests',
  params: {
    requests: [
      { id: 'token', method: 'htr_createToken', ... },
      { id: 'send', method: 'htr_sendTransaction', ... },
      { id: 'sign', method: 'htr_signWithAddress', ... }
    ]
  }
});
```

## Teaching This Feature

### For New Developers
Introduce batching early:
1. Show single operations first
2. Introduce batching as "shopping cart for operations"
3. Explain it improves UX
4. Show when to use each error handling mode

### For Existing Developers
Focus on:
1. Backwards compatibility (nothing breaks)
2. Migration patterns (common refactors)
3. Benefits (better UX, fewer edge cases)
4. Best practices (when to batch, when not to)

## Best Practices

**DO:**
- ✅ Batch related operations (token launch, multi-payment)
- ✅ Use meaningful operation IDs
- ✅ Show clear confirmation UI
- ✅ Handle partial failures gracefully
- ✅ Use `continue-on-error` for independent operations

**DON'T:**
- ❌ Batch unrelated operations (confuses users)
- ❌ Batch read operations (unnecessary)
- ❌ Make batches too large (max 10-20 operations)
- ❌ Rely on operation order for critical dependencies (use fail-fast)
- ❌ Ignore error responses (always check status)

# Reference-level explanation
[reference-level-explanation]: #reference-level-explanation

## Type Definitions

### Request Types

```typescript
interface BatchRequestsRpcRequest extends RpcRequest {
  method: 'htr_batchRequests';
  params: {
    network: string;
    requests: BatchOperationRequest[];
    errorHandling?: 'fail-fast' | 'continue-on-error';
  };
}

interface BatchOperationRequest {
  id: string;
  method: RpcMethods;
  params: any;
}

enum RpcMethods {
  // ... existing methods
  BatchRequests = 'htr_batchRequests',
}
```

### Response Types

```typescript
interface BatchRequestsResponse extends RpcResponse {
  type: RpcResponseTypes.BatchRequestsResponse;
  response: {
    status: 'success' | 'partial-success' | 'failed';
    results: BatchOperationResult[];
  };
}

interface BatchOperationResult {
  id: string;
  status: 'success' | 'failed' | 'skipped';
  response?: any;
  error?: {
    code: string;
    message: string;
  };
}

enum RpcResponseTypes {
  // ... existing types
  BatchRequestsResponse = 'BatchRequestsResponse',
}
```

### Trigger Types

```typescript
export enum TriggerTypes {
  // ... existing triggers
  BatchRequestsConfirmationPrompt,
  BatchRequestsLoadingTrigger,
  BatchRequestsLoadingFinishedTrigger,
}

export interface BatchOperationDetail {
  id: string;
  method: RpcMethods;
  description: string;
  details:
    | SendTransactionDetails
    | CreateTokenDetails
    | SendNanoContractDetails
    | SignWithAddressDetails
    | SignOracleDataDetails
    | GetAddressDetails
    | GetBalanceDetails
    | GetUtxosDetails;
}

export interface SendTransactionDetails {
  type: 'sendTransaction';
  outputs: IDataOutput[];
  inputs: IDataInput[];
  changeAddress?: string;
}

export interface CreateTokenDetails {
  type: 'createToken';
  name: string;
  symbol: string;
  amount: bigint;
  mintAddress: string | null;
  changeAddress: string | null;
  createMint: boolean;
  mintAuthorityAddress: string | null;
  allowExternalMintAuthorityAddress: boolean;
  createMelt: boolean;
  meltAuthorityAddress: string | null;
  allowExternalMeltAuthorityAddress: boolean;
  data: string[] | null;
}

export interface SendNanoContractDetails {
  type: 'sendNanoContract';
  blueprintId: string;
  ncId: string | null;
  actions: NanoContractAction[];
  method: string;
  args: unknown[];
  parsedArgs: unknown[];
}

export interface SignWithAddressDetails {
  type: 'signWithAddress';
  address: AddressInfoObject;
  message: string;
}

export interface SignOracleDataDetails {
  type: 'signOracleData';
  oracle: string;
  data: string;
}

export interface GetAddressDetails {
  type: 'getAddress';
  addressType: 'first_empty' | 'index' | 'client' | 'full_path';
  index?: number;
  fullPath?: string;
}

export interface GetBalanceDetails {
  type: 'getBalance';
  tokens: string[];
  addressIndexes?: number[];
}

export interface GetUtxosDetails {
  type: 'getUtxos';
  token?: string;
  maxUtxos?: number;
  filterAddress?: string;
  authorities?: number;
  amountSmallerThan?: number;
  amountBiggerThan?: number;
  maximumAmount?: number;
  onlyAvailableUtxos?: boolean;
}

export type BatchRequestsConfirmationPrompt = BaseConfirmationPrompt & {
  type: TriggerTypes.BatchRequestsConfirmationPrompt;
  data: {
    network: string;
    operations: BatchOperationDetail[];
    errorHandling: 'fail-fast' | 'continue-on-error';
  };
};

export interface BatchRequestsConfirmationResponse {
  type: TriggerResponseTypes.BatchRequestsConfirmationResponse;
  data: {
    accepted: boolean;
  };
}

export interface BatchRequestsLoadingTrigger {
  type: TriggerTypes.BatchRequestsLoadingTrigger;
  data: {
    total: number;
    current: number;
    currentOperation: string;
  };
}

export interface BatchRequestsLoadingFinishedTrigger {
  type: TriggerTypes.BatchRequestsLoadingFinishedTrigger;
}
```

## Implementation

### Main Handler

```typescript
export async function batchRequests(
  rpcRequest: BatchRequestsRpcRequest,
  wallet: IHathorWallet,
  requestMetadata: RequestMetadata,
  triggerHandler: TriggerHandler,
): Promise<BatchRequestsResponse> {

  // 1. Validate batch request schema
  const params = batchRequestsSchema.parse(rpcRequest.params);

  // 2. Validate network consistency
  validateNetwork(wallet, params.network);

  // 3. Validate all operations in params.requests use same network
  for (const request of params.requests) {
    if (request.params?.network && request.params.network !== params.network) {
      throw new InvalidParamsError(
        `All operations must use the same network. Expected ${params.network}, got ${request.params.network}`
      );
    }
  }

  // 4. Prepare all operations (validate and parse without executing)
  const operations: BatchOperationDetail[] = [];

  for (const request of params.requests) {
    try {
      const operationDetail = await prepareOperation(request, wallet);
      operations.push(operationDetail);
    } catch (err) {
      throw new InvalidParamsError(
        `Invalid parameters for operation ${request.id}: ${err.message}`
      );
    }
  }

  // 5. Show batch confirmation prompt
  const batchConfirmPrompt: BatchRequestsConfirmationPrompt = {
    ...rpcRequest,
    type: TriggerTypes.BatchRequestsConfirmationPrompt,
    data: {
      network: params.network,
      operations,
      errorHandling: params.errorHandling || 'fail-fast',
    },
  };

  const confirmResponse = await triggerHandler(
    batchConfirmPrompt,
    requestMetadata
  ) as BatchRequestsConfirmationResponse;

  if (!confirmResponse.data.accepted) {
    throw new PromptRejectedError('User rejected batch request');
  }

  // 6. Request PIN once (only if there are write operations)
  const writeOperationMethods = [
    RpcMethods.SendTransaction,
    RpcMethods.CreateToken,
    RpcMethods.SendNanoContractTx,
    RpcMethods.SignWithAddress,
    RpcMethods.SignOracleData,
    RpcMethods.CreateNanoContractCreateTokenTx,
  ];

  const hasWriteOperations = operations.some(op =>
    writeOperationMethods.includes(op.method)
  );

  let pinCode: string | undefined;

  if (hasWriteOperations) {
    const pinPrompt: PinConfirmationPrompt = {
      ...rpcRequest,
      type: TriggerTypes.PinConfirmationPrompt,
    };

    const pinResponse = await triggerHandler(
      pinPrompt,
      requestMetadata
    ) as PinRequestResponse;

    if (!pinResponse.data.accepted) {
      throw new PromptRejectedError('User rejected PIN prompt');
    }

    pinCode = pinResponse.data.pinCode;
  }

  // 7. Show initial loading state
  triggerHandler({
    type: TriggerTypes.BatchRequestsLoadingTrigger,
    data: {
      total: operations.length,
      current: 0,
      currentOperation: operations[0]?.id || '',
    },
  }, requestMetadata);

  // 8. Execute operations sequentially
  const results: BatchOperationResult[] = [];
  const errorHandling = params.errorHandling || 'fail-fast';

  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i];

    // Update loading state
    triggerHandler({
      type: TriggerTypes.BatchRequestsLoadingTrigger,
      data: {
        total: operations.length,
        current: i + 1,
        currentOperation: operation.id,
      },
    }, requestMetadata);

    try {
      const result = await executeOperation(
        operation,
        wallet,
        pinCode,
        requestMetadata
      );

      results.push({
        id: operation.id,
        status: 'success',
        response: result,
      });

    } catch (err) {
      const error = {
        code: err.code || 'UNKNOWN_ERROR',
        message: err.message || 'An unknown error occurred',
      };

      results.push({
        id: operation.id,
        status: 'failed',
        error,
      });

      // Handle error based on strategy
      if (errorHandling === 'fail-fast') {
        // Mark remaining operations as skipped
        for (let j = i + 1; j < operations.length; j++) {
          results.push({
            id: operations[j].id,
            status: 'skipped',
          });
        }
        break;
      }
      // If continue-on-error, continue to next operation
    }
  }

  // 9. Hide loading state
  triggerHandler({
    type: TriggerTypes.BatchRequestsLoadingFinishedTrigger,
  }, requestMetadata);

  // 10. Clear PIN from memory
  // (handled by JS garbage collection, but could use explicit clearing)

  // 11. Determine overall status
  const allSuccess = results.every(r => r.status === 'success');
  const allFailed = results.every(r => r.status === 'failed' || r.status === 'skipped');
  const status = allSuccess ? 'success' : allFailed ? 'failed' : 'partial-success';

  // 12. Return results
  return {
    type: RpcResponseTypes.BatchRequestsResponse,
    response: {
      status,
      results,
    },
  };
}
```

### Operation Preparation

```typescript
async function prepareOperation(
  request: BatchOperationRequest,
  wallet: IHathorWallet,
): Promise<BatchOperationDetail> {

  switch (request.method) {
    case RpcMethods.SendTransaction: {
      // Validate schema
      const validationResult = sendTransactionSchema.safeParse({
        method: request.method,
        params: request.params,
      });

      if (!validationResult.success) {
        throw new InvalidParamsError(
          validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        );
      }

      const { params } = validationResult.data;

      // Prepare transaction (this validates inputs and calculates change)
      const stubPinCode = '111111';
      const sendTx = await wallet.sendManyOutputsSendTransaction(
        params.outputs,
        {
          inputs: params.inputs || [],
          changeAddress: params.changeAddress,
          pinCode: stubPinCode,
        }
      );

      let preparedTx;
      try {
        preparedTx = await sendTx.prepareTxData();
      } catch (err) {
        if (err instanceof Error) {
          if (err.message.includes('Insufficient amount of tokens')) {
            throw new InsufficientFundsError(err.message);
          }
        }
        throw new PrepareSendTransactionError(
          err instanceof Error ? err.message : 'Unknown error preparing transaction'
        );
      }

      return {
        id: request.id,
        method: request.method,
        description: 'Send Transaction',
        details: {
          type: 'sendTransaction',
          outputs: preparedTx.outputs,
          inputs: preparedTx.inputs,
          changeAddress: params.changeAddress,
        },
      };
    }

    case RpcMethods.CreateToken: {
      const params = createTokenRpcSchema.parse(request.params);

      if (params.options.changeAddress && !await wallet.isAddressMine(params.options.changeAddress)) {
        throw new Error('Change address is not from this wallet');
      }

      return {
        id: request.id,
        method: request.method,
        description: `Create Token: ${params.name} (${params.symbol})`,
        details: {
          type: 'createToken',
          name: params.name,
          symbol: params.symbol,
          amount: params.amount,
          mintAddress: params.options.mintAddress,
          changeAddress: params.options.changeAddress,
          createMint: params.options.createMint,
          mintAuthorityAddress: params.options.mintAuthorityAddress,
          allowExternalMintAuthorityAddress: params.options.allowExternalMintAuthorityAddress,
          createMelt: params.options.createMelt,
          meltAuthorityAddress: params.options.meltAuthorityAddress,
          allowExternalMeltAuthorityAddress: params.options.allowExternalMeltAuthorityAddress,
          data: params.options.data,
        },
      };
    }

    case RpcMethods.SendNanoContractTx: {
      const params = sendNanoContractSchema.parse(request.params);

      let blueprintId = params.blueprintId;
      if (blueprintId) {
        // Validate blueprint
        try {
          await ncApi.getBlueprintInformation(blueprintId);
        } catch (e) {
          throw new SendNanoContractTxError(`Invalid blueprint ID ${blueprintId}`);
        }
      } else {
        // Get blueprint from NC ID
        try {
          blueprintId = await nanoUtils.getBlueprintId(params.ncId!, wallet);
        } catch {
          throw new SendNanoContractTxError(
            `Error getting blueprint id with nc id ${params.ncId}`
          );
        }
      }

      // Validate and parse blueprint method args
      config.setServerUrl(wallet.getServerUrl());
      const result = await nanoUtils.validateAndParseBlueprintMethodArgs(
        blueprintId!,
        params.method,
        params.args,
        new Network(params.network)
      );
      const parsedArgs = result.map(data => ({ ...data, parsed: data.field.toUser() }));

      return {
        id: request.id,
        method: request.method,
        description: `Nano Contract: ${params.method}`,
        details: {
          type: 'sendNanoContract',
          blueprintId: blueprintId!,
          ncId: params.ncId,
          actions: params.actions,
          method: params.method,
          args: params.args,
          parsedArgs,
        },
      };
    }

    case RpcMethods.SignWithAddress: {
      const parseResult = signWithAddressSchema.safeParse({
        method: request.method,
        params: request.params,
      });

      if (!parseResult.success) {
        throw new InvalidParamsError(
          parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        );
      }

      const { params } = parseResult.data;
      const base58 = await wallet.getAddressAtIndex(params.addressIndex);
      const addressPath = await wallet.getAddressPathForIndex(params.addressIndex);

      const address: AddressInfoObject = {
        address: base58,
        index: params.addressIndex,
        addressPath,
        info: undefined,
      };

      return {
        id: request.id,
        method: request.method,
        description: `Sign Message with Address ${params.addressIndex}`,
        details: {
          type: 'signWithAddress',
          address,
          message: params.message,
        },
      };
    }

    case RpcMethods.SignOracleData: {
      const parseResult = signOracleDataSchema.safeParse(request.params);

      if (!parseResult.success) {
        throw new InvalidParamsError(
          parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        );
      }

      const params = parseResult.data;

      return {
        id: request.id,
        method: request.method,
        description: `Sign Oracle Data for ${params.oracle}`,
        details: {
          type: 'signOracleData',
          oracle: params.oracle,
          data: params.data,
        },
      };
    }

    case RpcMethods.GetAddress: {
      const params = getAddressSchema.parse(request.params);

      return {
        id: request.id,
        method: request.method,
        description: `Get Address (${params.type})`,
        details: {
          type: 'getAddress',
          addressType: params.type,
          index: params.type === 'index' ? params.index : undefined,
          fullPath: params.type === 'full_path' ? params.fullPath : undefined,
        },
      };
    }

    case RpcMethods.GetBalance: {
      const params = getBalanceSchema.parse(request.params);

      return {
        id: request.id,
        method: request.method,
        description: `Get Balance (${params.tokens.length} token${params.tokens.length > 1 ? 's' : ''})`,
        details: {
          type: 'getBalance',
          tokens: params.tokens,
          addressIndexes: params.addressIndexes,
        },
      };
    }

    case RpcMethods.GetUtxos: {
      const validatedRequest = getUtxosSchema.parse({
        method: request.method,
        params: request.params,
      });

      return {
        id: request.id,
        method: request.method,
        description: `Get UTXOs${validatedRequest.params.token ? ` for token ${validatedRequest.params.token}` : ''}`,
        details: {
          type: 'getUtxos',
          token: validatedRequest.params.token,
          maxUtxos: validatedRequest.params.maxUtxos,
          filterAddress: validatedRequest.params.filterAddress,
          authorities: validatedRequest.params.authorities,
          amountSmallerThan: validatedRequest.params.amountSmallerThan,
          amountBiggerThan: validatedRequest.params.amountBiggerThan,
          maximumAmount: validatedRequest.params.maximumAmount,
          onlyAvailableUtxos: validatedRequest.params.onlyAvailableUtxos,
        },
      };
    }

    default:
      throw new Error(`Unsupported batch operation: ${request.method}`);
  }
}
```

### Operation Execution

```typescript
async function executeOperation(
  operation: BatchOperationDetail,
  wallet: IHathorWallet,
  pinCode: string | undefined,
  metadata: RequestMetadata,
): Promise<any> {

  switch (operation.method) {
    case RpcMethods.SendTransaction: {
      const details = operation.details as SendTransactionDetails;

      // Transaction was already prepared in prepareOperation
      // Now we execute with the real PIN
      const sendTx = await wallet.sendManyOutputsSendTransaction(
        details.outputs,
        {
          inputs: details.inputs,
          changeAddress: details.changeAddress,
          pinCode,
        }
      );

      return await sendTx.run(null, pinCode);
    }

    case RpcMethods.CreateToken: {
      const details = operation.details as CreateTokenDetails;

      return await wallet.createNewToken(
        details.name,
        details.symbol,
        details.amount,
        {
          mintAddress: details.mintAddress,
          changeAddress: details.changeAddress,
          createMint: details.createMint,
          mintAuthorityAddress: details.mintAuthorityAddress,
          allowExternalMintAuthorityAddress: details.allowExternalMintAuthorityAddress,
          createMelt: details.createMelt,
          meltAuthorityAddress: details.meltAuthorityAddress,
          allowExternalMeltAuthorityAddress: details.allowExternalMeltAuthorityAddress,
          data: details.data,
          pinCode,
        }
      );
    }

    case RpcMethods.SendNanoContractTx: {
      const details = operation.details as SendNanoContractDetails;

      // For nano contract, we need the caller address
      // This should be obtained from the confirmation response
      // For now, use the first address (this will be refined)
      const caller = await wallet.getAddressAtIndex(0);

      const txData = {
        ncId: details.ncId,
        blueprintId: details.blueprintId,
        actions: details.actions,
        args: details.args,
      };

      return await wallet.createAndSendNanoContractTransaction(
        details.method,
        caller,
        txData,
        { pinCode }
      );
    }

    case RpcMethods.SignWithAddress: {
      const details = operation.details as SignWithAddressDetails;

      const signature = await wallet.signMessageWithAddress(
        details.message,
        details.address.index,
        pinCode,
      );

      return {
        message: details.message,
        signature,
        address: details.address,
      };
    }

    case RpcMethods.SignOracleData: {
      const details = operation.details as SignOracleDataDetails;

      const type = 'str';
      const oracleDataBuffer = nanoUtils.getOracleBuffer(
        details.oracle,
        new Network(wallet.getNetworkObject().name)
      );

      const signedData = await nanoUtils.getOracleSignedDataFromUser(
        oracleDataBuffer,
        '', // nc_id not needed here
        `SignedData[${type}]`,
        details.data,
        wallet,
        { pinCode: pinCode! }
      );

      return {
        data: details.data,
        signedData,
        oracle: details.oracle,
      };
    }

    case RpcMethods.GetAddress: {
      const details = operation.details as GetAddressDetails;

      let addressInfo: AddressInfoObject;

      switch (details.addressType) {
        case 'first_empty':
          addressInfo = await wallet.getCurrentAddress();
          break;
        case 'full_path':
          throw new NotImplementedError('full_path not implemented');
        case 'index': {
          const address = await wallet.getAddressAtIndex(details.index!);
          const addressPath = await wallet.getAddressPathForIndex(details.index!);
          addressInfo = { address, index: details.index!, addressPath };
          break;
        }
        case 'client': {
          // For batch, 'client' type needs to be handled differently
          // as it requires additional user interaction mid-batch
          throw new Error('client type address requests not supported in batch');
        }
      }

      return addressInfo;
    }

    case RpcMethods.GetBalance: {
      const details = operation.details as GetBalanceDetails;

      if (details.addressIndexes) {
        throw new NotImplementedError('addressIndexes not implemented');
      }

      const balances = (await Promise.all(
        details.tokens.map(token => wallet.getBalance(token))
      )).flat();

      return balances;
    }

    case RpcMethods.GetUtxos: {
      const details = operation.details as GetUtxosDetails;

      const options = {
        token: details.token,
        authorities: details.authorities,
        max_utxos: details.maxUtxos,
        filter_address: details.filterAddress,
        amount_smaller_than: details.amountSmallerThan,
        amount_bigger_than: details.amountBiggerThan,
        max_amount: details.maximumAmount,
        only_available_utxos: details.onlyAvailableUtxos,
      };

      const utxoDetails = await wallet.getUtxos(options);
      return utxoDetails;
    }

    default:
      throw new Error(`Unsupported operation: ${operation.method}`);
  }
}
```

### Schema Validation

```typescript
const batchRequestsSchema = z.object({
  method: z.literal(RpcMethods.BatchRequests),
  params: z.object({
    network: z.string().min(1),
    requests: z.array(z.object({
      id: z.string().min(1),
      method: z.nativeEnum(RpcMethods),
      params: z.any(),
    })).min(1).max(20), // Limit to 20 operations
    errorHandling: z.enum(['fail-fast', 'continue-on-error']).default('fail-fast'),
  }),
});
```

### RPC Handler Integration

```typescript
// In rpcHandler/index.ts
export const handleRpcRequest = async (
  request: RpcRequest,
  wallet: IHathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
): Promise<RpcResponse> => {
  switch (request.method) {
    // ... existing cases

    case RpcMethods.BatchRequests: return batchRequests(
      request as BatchRequestsRpcRequest,
      wallet,
      requestMetadata,
      promptHandler,
    );

    default: throw new InvalidRpcMethod();
  }
};
```

# Drawbacks
[drawbacks]: #drawbacks

## 1. Complexity for Users

**Problem**: Batch approval UI is more complex than single operation approval.

A user reviewing 10 operations must:
- Scroll through all operations
- Understand each operation's details
- Make a binary decision (approve all or reject all)
- Cannot selectively approve/reject individual operations

**Risk**: Users may approve without reading (security risk) or feel overwhelmed and reject.

## 2. Partial Failure Confusion

**Problem**: Partial success states can confuse users and dApp developers.

In `continue-on-error` mode:
- Some operations succeed, others fail
- Blockchain state is modified partially
- Cannot rollback successful operations
- Users may not understand the outcome

**Example**: User approves batch to send to 5 recipients. 3 succeed, 2 fail due to insufficient funds. User now has:
- 3 successful payments (can't undo)
- 2 failed payments (still need to retry)
- Confusion about "did it work or not?"

# Rationale and alternatives
[rationale-and-alternatives]: #rationale-and-alternatives

# Future possibilities
[future-possibilities]: #future-possibilities

## Operation Dependencies

Allow operations to reference outputs from previous operations:

```json
{
  "requests": [
    {
      "id": "create-token",
      "method": "htr_createToken",
      "params": { "name": "MyToken", "symbol": "MTK", "amount": "1000" }
    },
    {
      "id": "send-token",
      "method": "htr_sendTransaction",
      "params": {
        "outputs": [{
          "address": "HVP...",
          "value": "100",
          "token": "${create-token.response.hash}" // Reference!
        }]
      }
    }
  ]
}
```

**Benefits**:
- Eliminate manual result passing
- Enable complex workflows
- Reduce dApp code complexity

**Challenges**:
- Error handling (dependency failed)
- Circular dependency detection

## Parallel Execution (Low Priority)

Allow explicit parallel execution for independent operations:

```json
{
  "requests": [
    {
      "id": "payment-1",
      "method": "htr_sendTransaction",
      "parallel": true,
      "params": { "..." }
    },
    {
      "id": "payment-2",
      "method": "htr_sendTransaction",
      "parallel": true,
      "params": { "..." }
    }
  ]
}
```

**Benefits**:
- Faster execution for independent ops
- Better resource utilization

**Challenges**:
- Wallet state management (concurrent access)
- Error handling complexity

## Integration with Other Features

### With Multi-Sig
Batch requests from multi-sig wallets:
- Multiple approvers for batch
- Threshold signatures for entire batch
- Clear audit trail

### With Hardware Wallets
Batch signing with hardware wallet:
- Show all operations on device
- Single device interaction
- Secure PIN entry on device

### With Account Abstraction
If Hathor adds account abstraction:
- Sponsor batch gas fees
- Delegate batch execution
- Programmable batch logic

## Holistic Impact

This feature positions Hathor for:
1. **Sophisticated dApps**: Enable complex workflows (DeFi, DAOs, Gaming)
2. **Competitive UX**: Match or exceed other chains
3. **Developer Attraction**: Easier to build on Hathor
4. **Future Extensibility**: Foundation for advanced features

The batched RPC is not just a UX improvement—it's a platform capability that unlocks new possibilities for the Hathor ecosystem.
