# Hathor RPC lib

## Description

**Hathor RPC library** is the official and reference library for implementing the client and server sides of JSON-RPC APIs for communication between dApps and wallet applications on Hathor platform.

## Installation

```bash
npm i @hathor/hathor-rpc-handler
```

Package released at https://www.npmjs.com/package/@hathor/hathor-rpc-handler .

## Usage

For how to integrate a DApp front end with Hathor wallets, see https://docs.hathor.network/pathways/journeys/build-dapp#integrating-dapp-with-wallets .

For the API reference, see [`./docs/openrpc.json`](./docs/openrpc.json)

For how to implement the integration, see https://docs.hathor.network/references/sdk/dapp/wallet-integration-development .

## Support

If after consulting the documentation, you still need **help to use Hathor RPC library**, [send a message to the `#development` channel on Hathor Discord server for assistance from Hathor team and community members](https://discord.com/channels/566500848570466316/663785995082268713).

If you observe an incorrect behavior while using Hathor RPC library, see [the "Issues" subsection in "Contributing"](#issues).

## Development

Prerequisites:
- Node.js >= 20
- Yarn v4
- [NixOS](https://nixos.org/download/#download-nix)

1. To enable commands `nix develop` and `nix build` using flakes, add to the configuration file `/etc/nix/nix.conf`:

```bash
experimental-features = nix-command flakes
```

2. Clone the repository:

```bash
$ git clone https://github.com/HathorNetwork/hathor-rpc-lib.git
```

3. Initialize nix development environment:

```bash
$ nix develop
```

4. Install the dependencies:

```bash
yarn
```

## Tests

```bash
yarn tests
```

## Contributing

### Issues

If you observe an incorrect behavior while using Hathor RPC library, we encourage you to [open an issue to report this failure](https://github.com/HathorNetwork/hathor-rpc-lib/issues/new).

You can also [open an issue to request a new feature you wish to see](https://github.com/HathorNetwork/hathor-rpc-lib/issues/new).

### Pull requests

To contribute to the development of Hathor RPC library, we encourage you to fork the `master` branch, implement your code, and then [open a pull request to merge it into `master`, selecting the "feature branch template"](https://github.com/HathorNetwork/hathor-rpc-lib/compare).

### Security

Please do not open an issue to report a security breach nor submit a pull request to fix it. Instead, follow the guidelines described in [SECURITY](SECURITY.md) for safely reporting, fixing, and disclosing security issues.

## Miscellaneous

A miscellany with additional documentation and resources:
- [RPC lib design doc — RFC](https://github.com/HathorNetwork/rfcs/blob/master/projects/web-wallet/rpc-protocol.md)
