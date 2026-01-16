# Create Hathor dApp

Create Hathor dApps with one command! This CLI tool scaffolds a complete Next.js application integrated with the Hathor Snap, ready to interact with Hathor nano contracts.

## Quick Start

```bash
npx @hathor/create-hathor-dapp my-dapp
cd my-dapp
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your dApp!

## Usage

### NPX (Recommended)

```bash
npx @hathor/create-hathor-dapp my-dapp
```

### Global Installation

```bash
npm install -g @hathor/create-hathor-dapp
create-hathor-dapp my-dapp
```

## What's Included

The generated template includes:

- **🎲 Complete Dice Game**: A fully functional provably fair dice game
- **🦊 MetaMask Snap Integration**: Pre-configured Hathor Snap connection
- **⚡ Nano Contract Interactions**: Examples of deposits, withdrawals, and method calls
- **💰 Liquidity Pool**: Complete liquidity provider functionality
- **🎨 Beautiful UI**: Responsive design with Tailwind CSS
- **📱 Mobile-Friendly**: Works on all devices
- **🔐 TypeScript**: Full type safety throughout
- **📚 Documentation**: Comprehensive guides and examples

## Features

### Wallet Integration

- Connect/disconnect wallet
- Display wallet address and network
- Switch between mainnet and testnet
- Balance display

### Dice Game

- Adjustable bet amounts
- Customizable win threshold
- Real-time probability calculations
- Animated dice rolling
- Game history tracking
- Win/loss statistics

### Liquidity Pool

- Add liquidity to the pool
- Remove liquidity (with ROI calculation)
- View pool statistics
- Track your position and earnings

### Developer Experience

- Hot reload during development
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- Modular component architecture
- Custom hooks for common patterns

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Hathor Network
- **Wallet**: MetaMask Snap
- **Contracts**: Hathor Nano Contracts

## Requirements

- Node.js 18 or later
- MetaMask browser extension
- Hathor Snap (will be prompted to install)

## Project Structure

```
my-dapp/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Homepage (dice game)
│   ├── liquidity/         # Liquidity pool page
│   └── how-it-works/      # Documentation page
├── components/            # React components
│   ├── wallet/           # Wallet connection components
│   ├── dice/             # Dice game components
│   ├── contract/         # Contract interaction components
│   └── liquidity/        # Liquidity pool components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and types
├── config/               # Configuration files
└── styles/               # Global styles
```

## Customization

### Change Network

Edit `.env.local`:

```env
NEXT_PUBLIC_DEFAULT_NETWORK=mainnet
```

### Update Contract

Edit `config/contract.ts`:

```typescript
export const DICE_CONTRACT_CONFIG = {
  contractId: 'your-contract-id',
  blueprintId: 'your-blueprint-id',
  // ...
};
```

### Modify UI Theme

Edit `tailwind.config.ts`:

```typescript
colors: {
  hathor: {
    primary: "#6B46C1",
    secondary: "#805AD5",
    // ...
  },
}
```

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Run production server
npm run lint     # Run ESLint
```

## Deploying Your Own Contract

1. Write your nano contract blueprint
2. Deploy to Hathor Network
3. Update `NEXT_PUBLIC_DICE_CONTRACT_ID` in `.env.local`
4. Update contract methods in hooks if needed

## Learn More

- [Hathor Network](https://hathor.network)
- [Hathor Documentation](https://docs.hathor.network)
- [MetaMask Snaps](https://metamask.io/snaps/)
- [Next.js Documentation](https://nextjs.org/docs)

## Support

- GitHub Issues: [hathor-rpc-lib/issues](https://github.com/HathorNetwork/hathor-rpc-lib/issues)
- Discord: [Hathor Network Discord](https://discord.gg/hathor)

## License

MIT
