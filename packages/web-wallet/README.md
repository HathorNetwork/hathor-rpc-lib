# Hathor Web Wallet

A modern web wallet interface for the Hathor Snap, built with React, TypeScript, Vite, and TailwindCSS.

## Development

To run the web wallet in development mode:

```bash
# From the root of the monorepo
yarn install

# Navigate to the web wallet package
cd packages/web-wallet

# Start the development server
yarn dev
```

The application will be available at `http://localhost:3000`.

## Features

- **Balance Display**: View your total HTR balance
- **Send Tokens**: Send HTR and custom tokens with form validation
- **Receive Tokens**: Generate QR codes and copy wallet addresses
- **Asset Management**: View all your tokens in one place
- **Dark Theme**: Modern dark UI matching Hathor brand
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Zustand** - State management
- **React Hook Form** - Form handling and validation
- **QRCode.js** - QR code generation

## Build

To build for production:

```bash
yarn build
```

The built files will be in the `dist` directory.