# Hathor Dice dApp

A provably fair dice game built on Hathor Network using nano contracts. This dApp demonstrates how to integrate MetaMask Snap with Hathor and interact with nano contracts.

## Getting Started

### Prerequisites

- Node.js 18 or later
- MetaMask browser extension
- Hathor Snap (will be prompted to install when you connect)

### Installation

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Development

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build for Production

```bash
npm run build
npm start
```

## Features

### 🎲 Dice Game

- Provably fair dice rolling powered by nano contracts
- Customizable bet amounts (1-1,000 HTR)
- Adjustable win threshold (1%-99%)
- Real-time probability and payout calculations
- Game history with win/loss tracking
- Contract balance management

### 💰 Liquidity Pool

- Provide liquidity and earn from house edge (1.90%)
- View your position and ROI
- Add/remove liquidity at any time
- Pool statistics and utilization metrics

### 🔐 Wallet Integration

- Connect via MetaMask Snap
- View wallet address and balance
- Switch between mainnet and testnet
- Automatic network detection

## Project Structure

```
├── app/
│   ├── page.tsx              # Homepage (dice game)
│   ├── liquidity/page.tsx    # Liquidity pool
│   └── how-it-works/page.tsx # Documentation
├── components/
│   ├── wallet/               # Wallet components
│   ├── dice/                 # Game components
│   ├── contract/             # Contract interaction
│   └── liquidity/            # LP components
├── hooks/
│   ├── useHathorWallet.ts    # Wallet hook
│   ├── usePlaceBet.ts        # Bet placement
│   ├── useLiquidity.ts       # LP operations
│   └── useGameHistory.ts     # History management
├── lib/
│   ├── hathor/               # Hathor utilities
│   ├── dice/                 # Game logic
│   └── utils/                # Helper functions
└── config/
    └── contract.ts           # Contract configuration
```

## Configuration

### Environment Variables

Create a `.env.local` file:

```env
# Snap Configuration
NEXT_PUBLIC_SNAP_ORIGIN=npm:@hathor/snap
# For local snap development:
# NEXT_PUBLIC_SNAP_ORIGIN=local:http://localhost:8080

# Network
NEXT_PUBLIC_DEFAULT_NETWORK=testnet

# Dice Contract
NEXT_PUBLIC_DICE_CONTRACT_ID=0x...
NEXT_PUBLIC_DICE_BLUEPRINT_ID=hathor-dice
```

### Contract Configuration

Edit `config/contract.ts` to update contract settings:

```typescript
export const DICE_CONTRACT_CONFIG = {
  contractId: process.env.NEXT_PUBLIC_DICE_CONTRACT_ID,
  blueprintId: 'hathor-dice',
  houseEdgeBasisPoints: 190, // 1.90%
  maxBetAmount: 100_000_00,  // 1000 HTR
  // ...
};
```

## How It Works

### Placing a Bet

1. User selects bet amount and threshold
2. dApp calls `htr_sendNanoContractTx` with:
   - Deposit action (bet amount)
   - Method: `place_bet`
   - Args: `[betAmount, threshold]`
3. Nano contract generates random number
4. Contract calculates payout
5. Winnings added to user's contract balance

### Claiming Winnings

1. User clicks "Claim" button
2. dApp calls `htr_sendNanoContractTx` with:
   - Withdrawal action (balance amount)
   - Method: `claim_balance`
3. HTR transferred back to user's wallet

### Providing Liquidity

1. User enters amount to add
2. dApp calls `htr_sendNanoContractTx` with:
   - Deposit action (liquidity amount)
   - Method: `add_liquidity`
3. Contract records user's share
4. User earns from house edge proportionally

## Customization

### Styling

This template uses Tailwind CSS. Customize colors in `tailwind.config.ts`:

```typescript
colors: {
  hathor: {
    primary: "#6B46C1",
    secondary: "#805AD5",
    accent: "#9F7AEA",
  },
}
```

### Adding New Contract Methods

1. Add method to `hooks/` directory
2. Create UI component in `components/`
3. Import and use in pages

Example:

```typescript
// hooks/useMyMethod.ts
export function useMyMethod() {
  const invokeSnap = useInvokeSnap();

  const callMethod = async (param: number) => {
    const response = await invokeSnap({
      method: 'htr_sendNanoContractTx',
      params: {
        network: DICE_CONTRACT_CONFIG.network,
        nc_id: DICE_CONTRACT_CONFIG.contractId,
        nc_method: 'my_method',
        nc_args: [param],
        actions: [/* ... */],
      },
    });
    return response;
  };

  return { callMethod };
}
```

## Deploying Your Own Contract

### 1. Write the Blueprint

See the Hathor Dice blueprint example in the repository.

### 2. Deploy to Hathor

Deploy your blueprint to Hathor Network (testnet first!).

### 3. Update Configuration

```typescript
// config/contract.ts
export const DICE_CONTRACT_CONFIG = {
  contractId: 'your-deployed-contract-id',
  blueprintId: 'your-blueprint-id',
  // ...
};
```

### 4. Update Methods

Modify hooks in `hooks/` to match your contract's methods.

## Development Tips

### Local Snap Development

To develop against a local snap:

1. Start snap dev server: `cd ../snap && yarn dev`
2. Update `.env.local`: `NEXT_PUBLIC_SNAP_ORIGIN=local:http://localhost:8080`
3. Restart Next.js dev server

### Debugging

- Check browser console for errors
- Use MetaMask developer mode
- View transaction details on Hathor Explorer

### Testing

Write tests for your components and hooks:

```bash
npm test
```

## Resources

- [Hathor Documentation](https://docs.hathor.network)
- [Nano Contracts Guide](https://docs.hathor.network/guides/nano-contracts/)
- [MetaMask Snaps](https://metamask.io/snaps/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Troubleshooting

### MetaMask Not Detected

- Install MetaMask extension
- Refresh the page
- Check browser console for errors

### Snap Installation Fails

- Update MetaMask to latest version
- Enable snaps in MetaMask settings
- Try clearing MetaMask cache

### Transaction Fails

- Check you have sufficient HTR balance
- Verify you're on the correct network
- Check contract ID is correct

## License

MIT

## Support

For issues and questions:
- GitHub: [hathor-rpc-lib/issues](https://github.com/HathorNetwork/hathor-rpc-lib/issues)
- Discord: [Hathor Network](https://discord.gg/hathor)
