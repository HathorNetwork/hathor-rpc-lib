# Hathor Web Wallet

Web interface for interacting with Hathor blockchain via MetaMask Snap.

## Overview

Browser-based wallet that connects to the Hathor network through a MetaMask Snap extension. Supports HTR and custom token transfers, transaction history, NFT detection, and network switching between mainnet and testnet.

## Prerequisites

- Node.js 22+
- Yarn 4.x
- MetaMask Flask browser extension (required for development mode Snaps)
- Running Hathor Snap (local development or installed)

**Note:** MetaMask Flask is the development version of MetaMask that supports running Snaps in development mode. Download it from [metamask.io/flask](https://metamask.io/flask). For production use, the standard MetaMask extension can be used with published Snaps.

## Quick Start

```bash
# Install dependencies (from monorepo root)
yarn install

# Start development server
yarn workspace @hathor/web-wallet dev

# Access at http://localhost:5173
```

## Development

```bash
# Run tests
yarn workspace @hathor/web-wallet test

# Run tests with UI
yarn workspace @hathor/web-wallet test:ui

# Run tests with coverage
yarn workspace @hathor/web-wallet test:coverage

# Lint code
yarn workspace @hathor/web-wallet lint

# Build for production
yarn workspace @hathor/web-wallet build

# Preview production build
yarn workspace @hathor/web-wallet preview
```

## Architecture

### Tech Stack
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Vitest** - Testing framework
- **Radix UI** - Headless UI components
- **TailwindCSS** - Styling
- **React Hook Form + Zod** - Form validation

### Project Structure

```
src/
├── components/         # React components (dialogs, UI elements)
├── contexts/           # React Context + custom hooks
│   └── hooks/         # Domain-specific hooks (connection, balance, tokens, etc.)
├── services/          # Business logic services
│   ├── HathorWalletService.ts      # Snap RPC interactions
│   ├── ReadOnlyWalletService.ts    # Read-only wallet operations
│   ├── TokenRegistryService.ts     # Token registration/storage
│   ├── TokenStorageService.ts      # LocalStorage persistence
│   └── NftDetectionService.ts      # NFT metadata fetching
├── utils/             # Utility functions (logging, token loading, etc.)
├── types/             # TypeScript type definitions
└── constants/         # App constants (timeouts, token IDs, etc.)
```

### State Management

Uses React Context API with custom hooks for state isolation:
- `useWalletConnection` - Connection, initialization, snap verification
- `useWalletBalance` - HTR balance and address management
- `useTokenManagement` - Custom token registration and balances
- `useTransactions` - Send transactions and history
- `useNetworkManagement` - Network switching with rollback
- `useAddressMode` - Address display mode (current/legacy)

### Key Services

**HathorWalletService**
Handles MetaMask Snap RPC calls (getXpub, sendTransaction, changeNetwork). Implements error handling for unauthorized access and snap crashes.

**ReadOnlyWalletService**
Manages read-only wallet instance from @hathor/wallet-lib. Provides balance fetching, transaction history, and WebSocket event listeners for real-time updates.

**TokenRegistryService**
Validates and registers custom tokens. Coordinates with TokenStorageService for persistence and NftDetectionService for metadata.

**NftDetectionService**
Fetches NFT metadata from DAG API with caching and batch detection support.

## Testing

Test suites cover:
- Service layer (wallet operations, token management)
- Context hooks (connection, network switching, error handling)
- Components (dialogs, forms)
- Utilities (logging, token loading)

Run `yarn test` for full test suite (157 tests).

## Configuration

### Environment Variables

```env
# Logging level (default: warn)
VITE_LOG_LEVEL=debug|info|warn|error

# Snap origin (default: local:http://localhost:8080)
SNAP_ORIGIN=npm:@hathor/snap  # For production
SNAP_ORIGIN=local:http://localhost:8080  # For local development
```

**Snap Origin Configuration:**

The web wallet uses the `SNAP_ORIGIN` environment variable from `@hathor/snap-utils` to determine which MetaMask Snap to connect to:

- **Development**: Defaults to `local:http://localhost:8080` for local snap development
- **Production**: Set to your published snap (e.g., `npm:@hathor/snap`)
- **Configuration**:
  - For development, no configuration needed (uses localhost default)
  - For production builds, create `.env.production` with your snap's published origin
  - The snap origin is shared across all snap-utils hooks (`useInvokeSnap`, `useRequestSnap`, etc.)

**Example `.env.production`:**
```env
SNAP_ORIGIN=npm:@hathor/snap
VITE_LOG_LEVEL=error
```

### Network Configuration

Default network is defined in `src/constants/index.ts`.

## Build Output

Production build creates optimized static assets in `dist/` directory. Build includes:
- Minified JavaScript bundles
- CSS with TailwindCSS purge
- Static HTML entry point
- Browser polyfills for Node.js modules (buffer, events, crypto, stream)

## Browser Compatibility

Requires modern browser with:
- ES2022 support
- MetaMask extension
- WebSocket support
- LocalStorage API
