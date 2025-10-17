# @hathor/snap

A MetaMask Snap for interacting with the Hathor blockchain.

## Overview

This package implements a MetaMask Snap, allowing users to interact with Hathor blockchain features directly from MetaMask. It provides custom dialogs and handles JSON-RPC requests for wallet operations.


## Features

- Handles installation via a custom dialog.
- Processes JSON-RPC requests for Hathor wallet operations.
- Integrates with `@hathor/hathor-rpc-handler` and `@hathor/wallet-lib`.
- Uses MetaMask Snaps SDK for secure wallet interactions.


## Installation
See [the root README](../../README.md#installation) for instructions on setting up the development environment.

## Usage

To start the Snap in development mode:

```bash
yarn workspace @hathor/snap start
```

This runs the Snap using the MetaMask Snaps CLI in watch mode.
