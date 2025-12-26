# Hathor RPC lib

## Description

**Hathor RPC library** is the official and reference library for implementing the client and server sides of JSON-RPC APIs for communication between dApps and wallet applications on Hathor platform.

## Installation

### System dependencies
```
Node: 22x or greater
yarn: v4 (yarn-berry)
```

### Install nix (preferred)

For a better developer experience we suggest nix usage for managing the environment. Visit this [link](https://nixos.org/download/#download-nix) to download it.

To enable the commands `nix develop` and `nix build` using flakes, add the following to your `/etc/nix/nix.conf` file:

```
experimental-features = nix-command flakes
```

### Clone the project and install dependencies
```sh
$ git clone https://github.com/HathorNetwork/hathor-rpc-lib.git
```
To initialize nix dev environment:
```sh
$ nix develop
```
then, install the dependencies:
```sh
yarn
```

For most development cases, build the packages right after:
```sh
yarn workspaces foreach -A run build
```

## Usage

TO DO

## Support

If after consulting the documentation, you still need **help to use Hathor RPC library**, [send a message to the `#development` channel on Hathor Discord server for assistance from Hathor team and community members](https://discord.com/channels/566500848570466316/663785995082268713).

If you observe an incorrect behavior while using Hathor RPC library, see [the "Issues" subsection in "Contributing"](#issues).

Tests

TO DO

## Development

### Testing the `snap` package

To test the interaction with the Metamask wallet, run the snaps in development mode:
```sh
yarn workspace @hathor/snap start
```

See more on the [`@hathor/snap` README](packages/snap/README.md).

## Contributing

### Issues

If you observe an incorrect behavior while using Hathor RPC library, we encourage you to [open an issue to report this failure](https://github.com/HathorNetwork/hathor-rpc-lib/issues/new).

You can also [open an issue to request a new feature you wish to see](https://github.com/HathorNetwork/hathor-rpc-lib/issues/new).

### Pull requests

To contribute to the development of Hathor RPC library, we encourage you to fork the `master` branch, implement your code, and then [open a pull request to merge it into `master`, selecting the "feature branch template"](https://github.com/HathorNetwork/hathor-rpc-lib/compare).

### Security

Please do not open an issue to report a security breach nor submit a pull request to fix it. Instead, follow the guidelines described in [SECURITY](SECURITY.md) for safely reporting, fixing, and disclosing security issues.

## Deploying the Web Wallet

The web-wallet can be deployed to AWS S3/CloudFront using Nix commands. Make sure you have AWS credentials configured.

### Available commands

From the nix dev shell (`nix develop`), the following commands are available:

```sh
# Build for a specific environment
web-wallet-build staging
web-wallet-build production

# Sync build to S3
web-wallet-sync staging [aws_profile]
web-wallet-sync production [aws_profile]

# Invalidate CloudFront cache
web-wallet-clear-cache staging [aws_profile]
web-wallet-clear-cache production [aws_profile]

# Full deploy (build + sync + cache invalidation)
web-wallet-deploy staging [aws_profile]
web-wallet-deploy production [aws_profile]
```

### Example: Deploy to staging

```sh
nix develop
web-wallet-deploy staging
```

Or with a specific AWS profile:

```sh
nix develop
web-wallet-deploy staging my-aws-profile
```

## Miscellaneous

A miscellany with additional documentation and resources:
- [RPC lib design doc — RFC](https://github.com/HathorNetwork/rfcs/blob/master/projects/web-wallet/rpc-protocol.md)
