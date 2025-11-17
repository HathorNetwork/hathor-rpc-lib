# Web Wallet - PR Review Guide

## Overview

Complete web-based wallet implementation for Hathor blockchain. Connects to MetaMask Snap for key management, uses read-only wallet for balance/history queries, supports HTR and custom tokens with NFT detection.

**Tech Stack:** React 19, TypeScript, Vite, TailwindCSS, Radix UI
**Lines of Code:** ~6,000+ across 113 files
**Test Coverage:** 157 tests, all passing

## Review Strategy

### Quick Review (30 minutes)
1. Read this guide
2. Review architecture diagram below
3. Check `src/contexts/WalletContext.tsx` (orchestration)
4. Run tests: `yarn test`
5. Run app: `yarn dev` and test basic flow

### Thorough Review (2-3 hours)
Follow sections 1-6 below in order.

### Deep Review (Full day)
All sections + compare with acceptance criteria + security analysis.

---

## 1. Architecture Overview

### Data Flow
```
User → UI Components → WalletContext → Custom Hooks → Services → Snap/ReadOnly Wallet
                                    ↓
                                State Management (React Context)
```

### Key Layers

**Presentation Layer** (`src/components/`)
- React components using Radix UI primitives
- Forms with react-hook-form + zod validation
- Dialogs for send, history, token registration

**State Layer** (`src/contexts/`)
- WalletContext orchestrates all state
- 6 domain-specific hooks (connection, balance, tokens, transactions, network, address)
- React Context API for global state

**Business Logic** (`src/services/`)
- HathorWalletService: Snap RPC calls (write operations)
- ReadOnlyWalletService: Balance/history queries (read operations)
- TokenRegistryService: Token validation and registration
- NftDetectionService: Fetch NFT metadata from DAG

**Utilities** (`src/utils/`)
- Logging, token loading, address formatting, validation

---

## 2. Critical Files - Start Here

### Entry Point (2 files)
- `src/main.tsx` - App bootstrap, providers, error boundaries
- `src/App.tsx` - Main layout, routing (if any), top-level components

### Core State Management (7 files)
**Main orchestrator:**
- `src/contexts/WalletContext.tsx` (235 lines) - Wires all hooks, provides unified API

**Domain hooks:**
- `src/contexts/hooks/useWalletConnection.ts` (516 lines) - Connect/disconnect, snap verification, initialization
- `src/contexts/hooks/useNetworkManagement.ts` (233 lines) - Network switching with rollback on failure
- `src/contexts/hooks/useTokenManagement.ts` (141 lines) - Register/unregister tokens, balance tracking
- `src/contexts/hooks/useTransactions.ts` (102 lines) - Send transactions, fetch history
- `src/contexts/hooks/useWalletBalance.ts` (52 lines) - HTR balance and address refresh
- `src/contexts/hooks/useAddressMode.ts` (36 lines) - Toggle current/legacy address mode

**Review focus:** How state flows between hooks via callbacks. Is the separation of concerns clear?

---

## 3. Services Layer - Business Logic

### HathorWalletService.ts (~200 lines)
**Purpose:** Write operations via MetaMask Snap RPC

**Key methods:**
- `sendTransaction()` - Send HTR/tokens with timeout handling
- `getTransactionHistory()` - Fetch tx history with error handling
- Error wrapper that detects snap crashes and unauthorized access

**Review focus:**
- Timeout handling (uses SNAP_TIMEOUTS constants)
- Error classification (SnapUnauthorizedError vs generic errors)
- Null response handling (snap not responding)

### ReadOnlyWalletService.ts (~180 lines)
**Purpose:** Read operations using @hathor/wallet-lib

**Key methods:**
- `initialize()` - Start wallet with xpub + network, race condition guards
- `getBalance()` - Fetch token balances
- `getTransactionHistory()` - Query history
- `getCurrentAddress()` - Get current wallet address
- Event listeners for real-time transaction updates

**Review focus:**
- Race condition guards (prevents multiple concurrent initializations)
- Error aggregation in stop() method
- WebSocket event listener cleanup

### TokenRegistryService.ts (~150 lines)
**Purpose:** Token registration with validation and persistence

**Key methods:**
- `registerToken()` - Validate config string, save to storage, detect NFT
- `unregisterToken()` - Remove token (prevents HTR unregistration)
- `getRegisteredTokens()` - Load from storage for network

**Review focus:**
- Config string validation (prevents malformed tokens)
- LocalStorage coordination with TokenStorageService
- NFT detection integration

### NftDetectionService.ts (~100 lines)
**Purpose:** Fetch NFT metadata from Hathor DAG API

**Key methods:**
- `detectNft()` - Single token NFT check with caching
- `detectNftBatch()` - Batch detection for multiple tokens
- `clearCache()` - Force re-detection

**Review focus:**
- Caching strategy (prevents repeated API calls)
- Batch vs single detection performance
- Error handling (failed API calls don't block token display)

---

## 4. UI Components - User Interface

### Main Wallet UI (4 files)
- `src/components/WalletConnectButton.tsx` - Connect/disconnect button with loading states
- `src/components/BalanceCard.tsx` - HTR balance display (available + locked)
- `src/components/AddressDisplay.tsx` - Address with copy + QR code + mode toggle
- `src/components/TokenList.tsx` - Display registered tokens with send/history buttons

### Dialogs (4 files)
- `src/components/SendDialog.tsx` (~400 lines) - Send form with amount validation, timelock, address validation
- `src/components/HistoryDialog.tsx` (~300 lines) - Paginated transaction history
- `src/components/CreateTokenDialog.tsx` (~250 lines) - Token registration form
- `src/components/ConnectionLostModal.tsx` - Snap disconnection recovery

**Review focus - SendDialog:**
- Form validation (Zod schema, balance checks, address format)
- Timelock date/time picker integration
- Error display (user-friendly messages)

**Review focus - HistoryDialog:**
- Pagination logic
- Empty states (no transactions)
- Real-time updates when new transactions arrive

**Review focus - CreateTokenDialog:**
- Config string parsing and validation
- Duplicate token prevention
- Error messages for invalid configs

---

## 5. Utilities & Helpers

### Core Utilities (6 files)
- `src/utils/logger.ts` - Structured logging with levels (debug/info/warn/error)
- `src/utils/tokenLoading.ts` - Load tokens with balances, NFT detection, error aggregation
- `src/utils/addressMode.ts` - Address mode persistence, display formatting
- `src/utils/hathor.ts` - Hathor-specific utilities (amount formatting, validation)
- `src/constants/timeouts.ts` - Centralized timeout constants
- `src/constants/index.ts` - App constants (DEFAULT_NETWORK, TOKEN_IDS)

**Review focus:**
- `tokenLoading.ts` - Eliminated 70+ lines of duplicate code
- `logger.ts` - VITE_LOG_LEVEL environment variable support
- Error handling consistency across utilities

---

## 6. Tests - Quality Assurance

### Test Coverage (10 test files, 157 tests)

**Service Tests:**
- `HathorWalletService.test.ts` (13 tests) - RPC error handling, null responses
- `ReadOnlyWalletService.test.ts` (16 tests) - Race conditions, concurrent init, cleanup
- `TokenStorageService.test.ts` (15 tests) - LocalStorage errors, JSON parsing, migration

**Hook/Context Tests:**
- `WalletContext.test.tsx` (8 tests) - Error handling, cleanup verification
- `WalletContext.NetworkChange.test.tsx` (19 tests) - Rollback logic, snap crash detection

**Utility Tests:**
- `logger.test.ts` (15 tests) - Log levels, scoped loggers, formatting
- `tokenLoading.test.ts` (16 tests) - Balance fetching, NFT detection, error aggregation
- `hathor.test.ts` (29 tests) - Amount formatting, validation

**Component Tests:**
- `SendDialog.test.tsx` (7 tests) - Form validation, submission
- `CreateTokenDialog.test.tsx` (19 tests) - Config parsing, validation

**Review focus:**
- All tests pass: `yarn test`
- Coverage for critical paths (connection, send, network switch)
- Edge case handling (snap crashes, network errors, invalid input)

---

## 7. Security Considerations

### Critical Security Areas

**1. Input Validation**
- Address validation (prevents sending to invalid addresses)
- Amount validation (prevents negative values, exceeding balance)
- Token config validation (prevents malformed token registration)
- Check: `src/utils/hathor.ts`, `SendDialog.tsx`, `CreateTokenDialog.tsx`

**2. Snap Error Handling**
- Unauthorized access detection (SnapUnauthorizedError)
- Snap crash detection (DataCloneError, timeout errors)
- User cancellation handling (code 4001)
- Check: `HathorWalletService.ts`, `useWalletConnection.ts`

**3. Storage Security**
- No private keys stored (only xpub in localStorage)
- Network-specific token storage (prevents mainnet/testnet mixing)
- Cleanup on disconnect (clears all hathor* localStorage keys)
- Check: `useWalletConnection.ts` disconnect flow

**4. Network Isolation**
- Network switching validates snap is on correct network
- Rollback mechanism prevents stuck state on network change failure
- Check: `useNetworkManagement.ts` changeNetwork method

---

## 8. Known Limitations & TODOs

### Current Limitations
1. GenesisHash is empty string (TODO: populate from RPC handler)
2. Snap origin hardcoded to `local:http://localhost:8080` (dev only)
3. No transaction fee display before sending
4. No address book for frequently used addresses
5. Single address mode (no multi-address support)

### Future Enhancements
- Multi-signature transaction support
- Hardware wallet integration
- Transaction batching
- Advanced filtering (date range, amount range)
- Export transaction history

---

## 9. Testing the Application

### Prerequisites
```bash
# Ensure MetaMask with Snap support is installed
# Ensure Hathor Snap is running (local development)
```

### Manual Test Flow
```bash
# 1. Start app
yarn workspace @hathor/web-wallet dev

# 2. Connect wallet
- Click "Connect Wallet"
- Approve snap in MetaMask
- Verify balance displays
- Verify address displays with copy button

# 3. Test token registration
- Click "Register Token"
- Paste valid token config string
- Verify token appears in list with balance

# 4. Test send transaction
- Click "Send" on HTR or token
- Enter recipient address + amount
- Submit and approve in MetaMask
- Verify balance updates after confirmation

# 5. Test network switching
- Switch from mainnet to testnet
- Verify address/balance updates
- Verify tokens reload for new network

# 6. Test transaction history
- Click "History" on any token
- Verify pagination works
- Verify new transactions appear in real-time

# 7. Test disconnect
- Click disconnect
- Verify localStorage cleared
- Verify reconnect works
```

### Automated Tests
```bash
yarn workspace @hathor/web-wallet test          # Run all tests
yarn workspace @hathor/web-wallet test:ui       # Interactive UI
yarn workspace @hathor/web-wallet test:coverage # Coverage report
```

---

## 10. Review Checklist

### Architecture
- [ ] State management pattern is clear (Context + hooks)
- [ ] Service layer separation makes sense (Snap vs ReadOnly)
- [ ] Hook responsibilities are well-defined
- [ ] Component hierarchy is logical

### Code Quality
- [ ] No duplicate code (check if tokenLoading eliminates duplication)
- [ ] Magic numbers replaced with constants (SNAP_TIMEOUTS)
- [ ] Console.log replaced with structured logging
- [ ] Error messages are user-friendly
- [ ] TypeScript types are accurate

### Functionality
- [ ] All 10 features from acceptance criteria work
- [ ] Edge cases handled (snap crash, network error, invalid input)
- [ ] Loading states prevent double-clicks
- [ ] Error recovery paths are clear

### Testing
- [ ] All 157 tests pass
- [ ] Critical paths have test coverage
- [ ] Edge cases are tested
- [ ] No console errors when running tests

### Security
- [ ] No private keys in localStorage
- [ ] Input validation on all user inputs
- [ ] Snap errors don't expose sensitive info
- [ ] Network isolation prevents cross-contamination

### Performance
- [ ] No unnecessary re-renders
- [ ] Token balance fetching is batched
- [ ] NFT detection uses caching
- [ ] LocalStorage access is minimal

---

## Questions for Reviewer

1. **Architecture:** Does the hook-based state management make the code more maintainable than a monolithic Context?
2. **Services:** Is the split between HathorWalletService (write) and ReadOnlyWalletService (read) clear?
3. **Error Handling:** Are error messages clear enough for users to recover?
4. **Testing:** Is test coverage sufficient for critical paths (connection, send, network switch)?
5. **Security:** Are there any security concerns with storing xpub in localStorage?

---

## Estimated Review Time

- **Quick Review:** 30 minutes (architecture + run tests + basic flow)
- **Thorough Review:** 2-3 hours (all critical files + manual testing)
- **Deep Review:** 4-6 hours (full codebase + security analysis + comparison with requirements)
