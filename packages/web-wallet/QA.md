# Web Wallet QA Test Guide

## Prerequisites
- MetaMask Flask browser extension installed (for development)
- Test wallet with HTR balance for transaction tests
- Second wallet/address for send/receive tests

## Suggested Test Sequence

### 1. Initial Connection Tests
1. Open the web wallet at the deployed URL
1. Verify the Hathor logo and "Connect to Hathor Wallet" screen displays
1. Click "Connect Wallet" button
1. Approve the MetaMask Snap connection when prompted
1. Verify wallet loads successfully and displays:
   - Your wallet address in the header
   - Current network (Mainnet or Testnet)
   - HTR balance in the assets summary
   - "My Assets" section with token list

### 2. Header and Navigation Tests
1. **Copy Address**
   1. Click on the wallet address in the header
   1. Verify "Copied to clipboard" toast notification appears
   1. Paste the address elsewhere to confirm it copied correctly
1. **Hamburger Menu**
   1. Click the hamburger menu icon (☰) in the header
   1. Verify menu opens with options:
      - Create Tokens
      - Register Tokens
      - Disconnect (in red)
   1. Click outside the menu or on X to close it
   1. Verify menu closes properly

### 3. Network Switching Tests
1. Click the network button (Globe icon + network name)
1. Select a different network (Mainnet ↔ Testnet)
1. Wait for wallet to reconnect
1. Verify:
   - Network name updates in header
   - Wallet reconnects successfully
   - Balance updates for new network
   - Token list updates (network-specific tokens)
1. If switching fails, verify rollback to previous network works
1. Switch back to original network for remaining tests

### 4. Token Registration Tests
1. Open hamburger menu and click "Register Tokens"
1. **Invalid Token Configuration String**
   1. Enter random text (e.g., "invalid") in the configuration string textarea
   1. Verify "Invalid configuration string format or checksum" error appears inline
   1. Verify "Register Token" button is disabled
1. **Valid Token Preview** (you'll need a valid token configuration string)
   1. Paste a valid token configuration string: `[TokenName:TKN:uid:checksum]`
   1. Verify "Token Preview" section appears below showing:
      - Token name
      - Token symbol
      - Token UID (truncated)
   1. Verify format hint displays: "Format: [name:symbol:uid:checksum]"
1. **Successful Registration**
   1. Click "Register Token"
   1. Verify loading state shows on button
   1. Wait for success message (auto-closes after 1.5 seconds)
   1. Verify token appears in "My Assets" list
   1. Verify token shows correct name, symbol, and balance
1. **Duplicate Token Registration**
   1. Try registering the same token configuration string again
   1. Verify appropriate error message displays

### 5. Token Creation Tests
1. Open hamburger menu and click "Create Tokens"
1. **Form Layout Verification**
   1. Verify all fields are visible on a single screen:
      - Name input
      - Symbol input
      - Amount input with "Create as NFT" toggle
      - Mint/Melt authority checkboxes
      - Create Token button
1. **Name Validation**
   1. Leave name field empty and type in other fields
   1. Click "Create Token"
   1. Verify "Token name is required" error displays under name field
   1. Enter a name longer than 30 characters
   1. Verify "Token name must be 30 characters or less" error
   1. Enter valid name (e.g., "QA Test Token")
   1. Verify error clears
1. **Symbol Validation**
   1. Leave symbol empty and click "Create Token"
   1. Verify "Symbol is required" error
   1. Enter a symbol longer than 5 characters
   1. Verify "Symbol must be 5 characters or less" error
   1. Enter valid symbol (e.g., "QAT")
1. **Amount and Deposit Calculation**
   1. Enter amount "100"
   1. Verify "DEPOSIT" line appears showing 1.00 HTR (1% of 100 tokens)
   1. Verify "TOTAL" line shows deposit amount and available balance
   1. Enter amount greater than your HTR balance (e.g., 1000000)
   1. Verify insufficient balance warning appears (yellow box)
   1. Verify "Create Token" button is disabled
   1. Change amount to valid value (e.g., "100")
1. **NFT Toggle**
   1. Toggle "Create as NFT" switch on
   1. Verify "NFT Data" field appears
   1. Verify amount placeholder changes to "Enter quantity (e.g., 5)"
   1. Enter decimal amount (e.g., "1.5")
   1. Verify "NFT amount must be a whole number" error
   1. Enter whole number (e.g., "5")
   1. Verify error clears
   1. Enter NFT data (optional): "ipfs://test"
   1. Toggle NFT off to continue with fungible token
1. **Mint/Melt Authority**
   1. Check "Create a mint authority" checkbox
   1. Check "Create a melt authority" checkbox
   1. Verify both checkboxes can be selected independently
   1. Uncheck both for standard token
1. **Successful Token Creation** (requires sufficient HTR)
   1. Fill form with valid data:
      - Name: "QA Test Token"
      - Symbol: "QAT"
      - Amount: "100"
      - NFT: off
      - Mint/Melt: unchecked
   1. Verify deposit shows as 1.00 HTR
   1. Click "Create Token"
   1. Approve transaction in MetaMask Snap when prompted
   1. Wait for "Creating token" loading state
   1. Verify success screen appears showing:
      - "Token Created" header
      - Success message with token symbol
      - Configuration string in copyable box
      - Backup reminder
   1. Click copy icon next to config string
   1. Verify "Configuration copied to clipboard" toast
   1. Click "Ok" button
   1. Verify dialog closes and token appears in "My Assets"

### 6. Send Transaction Tests
1. **Access Send Screen**
   1. Click "Send" button from assets summary
   1. Verify send dialog opens on a single screen
   1. Verify form shows: token selector, amount input, address input
1. **Token Selection**
   1. Verify HTR is selected by default
   1. Click token selector dropdown
   1. Select a custom token from the list
   1. Verify token name updates in selector
   1. Verify balance shows for selected token
   1. Switch back to HTR
1. **Amount Validation**
   1. Enter invalid format (e.g., "abc" or "1.234")
   1. Verify "Invalid amount format. Use up to 2 decimal places." error
   1. Enter negative or zero amount
   1. Verify "Amount must be greater than 0" error
   1. Enter amount greater than available balance
   1. Verify "Insufficient balance" error displays
   1. Verify "Send" button is disabled
1. **Max Button**
   1. Click "Max" button next to amount field
   1. Verify amount field fills with full available balance
   1. Verify balance validation passes
1. **Address Validation**
   1. Leave address empty and enter amount
   1. Verify "Address is required" error when submitting
   1. Enter invalid text (e.g., "invalid")
   1. Verify "Invalid Hathor address format" error
   1. Enter valid address from wrong network (mainnet address while on testnet)
   1. Verify network-specific error message
   1. Enter valid address with wrong checksum
   1. Verify "Invalid address checksum" error
1. **Advanced Options**
   1. Click "Advanced" section to expand
   1. Verify timelock date picker appears
   1. Verify data output field appears
   1. Test timelock with past date - verify "Timelock date must be in the future" error
   1. Collapse advanced section
1. **Successful Transaction**
   1. Select HTR token
   1. Enter valid testnet/mainnet address
   1. Enter valid amount (e.g., 0.50 HTR)
   1. Verify no validation errors
   1. Click "Send"
   1. Verify MetaMask Snap approval prompt appears
   1. Approve transaction
   1. Wait for "Sending transaction" loading state
   1. Verify success message/state appears
   1. Verify balance updates automatically
   1. Check notification toast displays with:
      - "Sent HTR" title
      - Amount with minus sign
      - "View History" link
1. **Send Custom Token**
   1. Navigate to "My Assets"
   1. Find a custom token and click its "Send" button
   1. Verify send dialog opens with token pre-selected
   1. Complete send transaction
   1. Verify transaction succeeds
1. **NFT Send** (if NFT registered)
   1. Select an NFT token
   1. Enter decimal amount (e.g., "1.5")
   1. Verify "NFT amounts must be whole numbers only." error
   1. Enter whole number (e.g., "1")
   1. Send successfully

### 7. Receive Tests
1. Click "Receive" button from assets summary
1. Verify receive dialog opens showing:
   - "Receive Tokens" header
   - Subtitle: "Use this address to receive HTR or custom tokens"
   - QR code in white background box
   - Full wallet address in gray box below QR code
   - "Copy address" button (purple/primary color)
1. **Copy Address**
   1. Click "Copy address" button
   1. Verify "Address copied to clipboard" toast notification
   1. Paste elsewhere to confirm address copied correctly
   1. Verify copied address matches displayed address
1. **Receive Transaction**
   1. Copy the receive address
   1. From another wallet, send HTR or a custom token to this address
   1. Wait for transaction to be confirmed on blockchain
   1. Verify notification toast appears showing:
      - "Received HTR" (or token symbol) title
      - Amount with plus sign
      - "View History" link
   1. Click "View History" in notification
   1. Verify history dialog opens showing the received transaction
   1. Verify balance updates in header and assets summary
1. Close receive dialog and verify it closes properly

### 8. Transaction History Tests
1. **HTR History**
   1. Click on HTR token in "My Assets" list
   1. Verify full-screen history view opens (replaces home screen, not a modal overlay)
   1. Verify header shows:
      - Back arrow button (left side)
      - Hamburger menu with Create/Register Tokens (right side)
   1. Verify token details section displays:
      - Balance (available amount)
      - Token symbol badge
      - Token UID (truncated) with copy icon
      - "View on explorer" link
   1. Click copy icon next to token UID
   1. Verify "Copied to clipboard" toast appears
   1. Click "View on explorer" link
   1. Verify new tab opens to Hathor explorer token details page
1. **Transaction List**
   1. Verify transactions display in reverse chronological order (newest first)
   1. Each transaction should show:
      - Type icon (↗ for sent, ↙ for received)
      - Amount with color coding (red for sent, green for received)
      - Formatted date and time
      - External link icon
   1. Click external link icon on any transaction
   1. Verify new tab opens to explorer transaction details page
   1. If more than 10 transactions exist, scroll to bottom
   1. Verify "Load More" button appears
   1. Click "Load More"
   1. Verify loading spinner appears during load
   1. Verify next 10 transactions append to the list below existing ones
   1. Continue loading until all transactions fetched (button disappears when no more remain)
1. **Custom Token History**
   1. Click back arrow to return to home screen
   1. Click on a custom token in assets list
   1. Verify history shows only that token's transactions
   1. Verify amounts are displayed in that token's units (not HTR)
   1. Verify token details section shows custom token name/symbol/UID
1. **Empty History**
   1. Register a brand new token with no transactions (just created or never transacted)
   1. Click on it to view history
   1. Verify empty state displays (no transactions in list)
   1. Verify token details still display correctly
1. **Real-time Updates**
   1. Keep history view open for HTR
   1. From another wallet, send HTR to this wallet address
   1. Wait for transaction confirmation
   1. Verify new transaction appears at top of list automatically (no manual refresh)
   1. Verify balance updates in token details section
1. **Back Navigation**
   1. Click back arrow in header
   1. Verify returns to home screen with token list

### 9. Token Filtering and NFT Tests
1. **Filter Tabs**
   1. On home screen, locate filter tabs above "My Assets" section
   1. Verify three tabs are present: "All", "Tokens", "NFTs"
   1. Click "Tokens" tab
   1. Verify only fungible tokens display (HTR + custom tokens, no NFTs)
   1. Verify tab label shows count in format: "Tokens (X)"
1. **NFT Detection** (requires at least one NFT token)
   1. Create or register an NFT token
   1. Return to home screen
   1. Click "NFTs" tab
   1. Verify only NFT tokens display
   1. Verify NFT visual indicators (badge/icon showing it's an NFT)
   1. Verify tab label shows count: "NFTs (X)"
1. **All Filter**
   1. Click "All" tab
   1. Verify both fungible tokens and NFT tokens display together
   1. Verify HTR always appears first in the list
1. **Count Accuracy**
   1. Note the token counts displayed in each tab
   1. Verify counts match actual number of tokens in each category
   1. Register a new custom token
   1. Verify counts update automatically
   1. Unregister a token
   1. Verify counts decrease correctly

### 10. Token Unregistration Tests
1. **Access Unregister**
   1. Click on a registered custom token in "My Assets" (not HTR)
   1. In the full-screen history view, locate "Unregister Token" button
   1. Verify button is NOT present when viewing HTR history (only for custom tokens)
   1. Click "Unregister Token" button
1. **Confirmation Dialog**
   1. Verify modal dialog opens with title "Unregister token"
   1. Read the warning messages:
      - "If you unregister this token you won't be able to execute operations with it, unless you register it again."
      - "You won't lose your tokens, they will just not appear on this wallet anymore."
   1. Verify confirmation section displays:
      - Toggle switch (off by default)
      - Label: "I want to unregister the token"
      - Token info showing: "Token: [SYMBOL] ([NAME])"
   1. Verify "Unregister token" button at bottom is disabled
1. **Toggle Confirmation**
   1. Click the confirmation toggle switch
   1. Verify switch animates to "on" state with purple/primary background
   1. Verify "Unregister token" button becomes enabled
   1. Toggle switch off again
   1. Verify button becomes disabled again
   1. Toggle back on
1. **Successful Unregistration**
   1. Click "Unregister token" button
   1. Verify loading state appears: "Unregistering token" with spinner
   1. Wait for operation to complete
   1. Verify dialog closes automatically
   1. Verify view returns to home screen
   1. Verify token is removed from "My Assets" list
   1. Verify token counts in filter tabs update correctly (decrease by 1)
1. **Re-registration**
   1. Open hamburger menu and click "Register Tokens"
   1. Enter the same token configuration string used before
   1. Click "Register Token"
   1. Verify token can be re-registered successfully
   1. Verify token appears back in "My Assets" with correct balance
   1. Verify all transaction history is still accessible

### 11. Real-time Updates Tests
1. Keep the web wallet open
1. **Balance Updates**
   1. Send HTR to your wallet from another source
   1. Verify balance updates automatically (without refresh)
   1. Verify notification appears
1. **Transaction Notifications**
   1. Check that notification includes:
      - Transaction type (Sent/Received)
      - Amount
      - Token symbol
      - "View History" link
   1. Click "View History" in notification
   1. Verify it opens the correct token's history dialog

### 12. Disconnect and Reconnection Tests
1. **Disconnect Wallet**
   1. Open hamburger menu
   1. Click "Disconnect" (red text with logout icon)
   1. Verify confirmation modal appears
   1. Click "Cancel" and verify modal closes without disconnecting
   1. Open menu again and click "Disconnect"
   1. Confirm disconnection
   1. Verify wallet disconnects and returns to connection screen
1. **Reconnection**
   1. Click "Connect Wallet" again
   1. Verify MetaMask prompt (if required)
   1. Approve connection
   1. Verify wallet loads with same address
   1. Verify previously registered tokens persist
   1. Verify network preference persists

### 13. Error Handling Tests
1. **Snap Not Installed**
   1. Disconnect wallet
   1. Uninstall or disable Hathor Snap in MetaMask
   1. Try to connect wallet
   1. Verify appropriate error message about missing Snap
1. **Snap Crash Recovery**
   1. With wallet connected, simulate snap crash (if possible in dev environment)
   1. Try to perform an action (send, register token, etc.)
   1. Verify graceful error handling
   1. Verify connection can be restored
1. **Network Issues**
   1. Disconnect internet (or use browser dev tools to go offline)
   1. Try to send a transaction
   1. Verify appropriate network error message
   1. Reconnect internet
   1. Verify wallet recovers and syncs

### 14. UI/UX Tests
1. **Responsive Design**
   1. Test on mobile viewport (resize browser)
   1. Verify mobile menu works correctly
   1. Verify all dialogs are readable on small screens
   1. Test on tablet viewport
   1. Test on desktop viewport
1. **Dark Theme**
   1. Verify dark theme renders correctly throughout
   1. Check contrast and readability
1. **Loading States**
   1. Refresh the page
   1. Verify loading indicators appear during:
      - Initial connection check
      - Wallet connection
      - Transaction sending
      - Network switching
1. **Empty States**
   1. Connect a fresh wallet with no custom tokens
   1. Verify appropriate empty state in token list
   1. Check only HTR appears
