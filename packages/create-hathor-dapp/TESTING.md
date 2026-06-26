# Testing create-hathor-dapp Locally

## Quick Start

### 1. Test the CLI Tool

```bash
# From the repository root
cd packages/create-hathor-dapp

# Install CLI dependencies (if not already done)
npm install

# Test the CLI by creating a new project
cd /tmp
node /home/user/hathor-rpc-lib/packages/create-hathor-dapp/cli.js test-dice-app

# Follow the prompts:
# - Network: testnet
# - Package manager: npm
# - Install dependencies: yes
```

### 2. Run the Generated App

```bash
cd test-dice-app

# Start the development server
npm run dev

# Open http://localhost:3000
```

## What Works Without a Real Contract

### ✅ **Works Perfectly:**

1. **Wallet Connection**
   - Connect MetaMask + Hathor Snap
   - Display wallet address
   - Show connected network
   - Network switching

2. **UI/UX**
   - All components render
   - Bet controls (sliders, inputs)
   - Win chance calculations
   - Probability displays
   - Animations
   - Responsive design
   - Game history (localStorage)

3. **Client-Side Logic**
   - Probability calculations
   - Bet validation
   - Amount formatting
   - Address shortening
   - Relative time display

### ⚠️ **Requires Real Contract:**

1. **Place Bet** - Will fail because contract ID is fake
2. **Add/Remove Liquidity** - Will fail without real contract
3. **Claim Balance** - Will fail without real contract
4. **Contract Stats** - Shows placeholder data

## Testing Options

### Option A: Test UI Only (No Contract)

**What you can test:**
- ✅ Wallet connection flow
- ✅ UI components and styling
- ✅ Probability calculations
- ✅ Input validation
- ✅ Responsive design
- ✅ Navigation

**How to test:**
1. Connect your MetaMask wallet
2. Interact with bet controls
3. Verify calculations update correctly
4. Try to place a bet (will show error - expected)

### Option B: Deploy Test Contract (Full Testing)

**What you need:**
1. Deploy Hathor Dice blueprint to testnet
2. Get contract ID from deployment
3. Update `.env.local` with real contract ID

**Steps:**

```bash
# 1. Update environment variables
cat > .env.local << EOF
NEXT_PUBLIC_SNAP_ORIGIN=npm:@hathor/snap
NEXT_PUBLIC_DEFAULT_NETWORK=testnet
NEXT_PUBLIC_DICE_CONTRACT_ID=0x<your-real-contract-id>
NEXT_PUBLIC_DICE_BLUEPRINT_ID=hathor-dice
EOF

# 2. Restart dev server
npm run dev
```

Now everything will work!

### Option C: Mock Mode (Coming Soon)

We could add a mock mode that simulates contract responses for testing.

## Expected Behavior

### When Contract ID is Invalid

```
❌ Error placing bet:
   "Failed to send nano contract transaction"

This is EXPECTED because the contract ID is a placeholder.
```

### When Contract ID is Valid

```
✅ Bet placed successfully!
✅ Random number: 42.15
✅ Payout: 196.00 HTR
✅ You won!
```

## Testing Checklist

### 🎨 UI Testing
- [ ] Wallet connects successfully
- [ ] Address displays correctly (shortened)
- [ ] Network indicator shows correct network
- [ ] Bet amount slider works (1-1000 HTR)
- [ ] Threshold slider works (1-99%)
- [ ] Win chance updates when threshold changes
- [ ] Multiplier updates correctly
- [ ] Potential win calculates correctly
- [ ] Game history displays in sidebar
- [ ] All pages load (/, /liquidity, /how-it-works)

### 🧮 Calculation Testing
- [ ] Win chance = (threshold / 10000) * 100
- [ ] Multiplier = (1 / winChance) * (1 - 0.019)
- [ ] House edge shows 1.90%
- [ ] Bet validation catches invalid amounts
- [ ] Threshold validation catches invalid ranges

### 🔗 Navigation Testing
- [ ] Home page loads
- [ ] Liquidity page loads
- [ ] How It Works page loads
- [ ] Navigation links work
- [ ] Back button works

### 📱 Responsive Testing
- [ ] Works on mobile (< 768px)
- [ ] Works on tablet (768px - 1024px)
- [ ] Works on desktop (> 1024px)
- [ ] Sidebar moves below on mobile

### 🦊 Wallet Testing (with MetaMask)
- [ ] Snap installation prompt appears
- [ ] After install, wallet info shows
- [ ] Network switch triggers MetaMask prompt
- [ ] Get address call works
- [ ] Get balance call works (if snap supports it)

### 🎲 Contract Testing (requires real contract)
- [ ] Place bet triggers MetaMask confirmation
- [ ] Bet completes and shows result
- [ ] Balance updates in contract
- [ ] Claim balance works
- [ ] Add liquidity works
- [ ] Remove liquidity works

## Common Issues

### Issue 1: "Cannot find module 'fs-extra'"
**Solution:** Run `npm install` in `packages/create-hathor-dapp`

### Issue 2: "Port 3000 already in use"
**Solution:** Use different port: `npm run dev -- -p 3001`

### Issue 3: MetaMask not detected
**Solution:**
1. Install MetaMask browser extension
2. Refresh the page
3. Check browser console for errors

### Issue 4: Snap installation fails
**Solution:**
1. Update MetaMask to latest version
2. Enable snaps in MetaMask settings
3. Try in incognito/private window

### Issue 5: "Failed to place bet"
**Solution:** This is EXPECTED without a real contract ID. Deploy a contract or use mock mode.

## Development Workflow

### 1. Make Changes to Template

```bash
# Edit files in packages/create-hathor-dapp/template/
vim packages/create-hathor-dapp/template/components/dice/DiceGame.tsx
```

### 2. Test Changes

```bash
# Create new test project
cd /tmp
rm -rf test-app
node /path/to/cli.js test-app

# Run the app
cd test-app
npm run dev
```

### 3. Iterate

Repeat steps 1-2 until satisfied.

## Mock Contract Mode (Future)

To make testing easier, we could add a mock mode:

```typescript
// config/contract.ts
export const DICE_CONTRACT_CONFIG = {
  // Use mock mode when no valid contract ID
  useMockMode: process.env.NEXT_PUBLIC_USE_MOCK_MODE === 'true',
  // ...
};

// hooks/usePlaceBet.ts
if (DICE_CONTRACT_CONFIG.useMockMode) {
  // Simulate contract response
  return {
    randomNumber: Math.floor(Math.random() * 10000),
    payout: calculatePayout(betAmount, threshold),
    won: randomNumber < threshold,
  };
}
```

Would you like me to add this feature?

## Pro Tips

### Tip 1: Use React DevTools
Install React DevTools to inspect component state and props.

### Tip 2: Check Network Tab
Open browser DevTools → Network to see RPC calls to the snap.

### Tip 3: Check Console
Look for errors or warnings in the browser console.

### Tip 4: Test on Real Testnet
Deploy a simple contract to testnet for full integration testing.

### Tip 5: Use Git Branches
Test different configurations on different branches.

## Next Steps

1. **Basic UI Test** - Run template and test UI without contract
2. **Deploy Contract** - Deploy Hathor Dice to testnet
3. **Full Integration Test** - Test with real contract
4. **Customize** - Modify template for your use case
5. **Deploy** - Deploy to production with mainnet contract

## Questions?

- Check the main README.md
- Open an issue on GitHub
- Ask on Discord
