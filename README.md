# Hathor RPC lib

## Description

**Hathor RPC library** is the official and reference library for implementing the client and server sides of JSON-RPC APIs for communication between dApps and wallet applications on Hathor platform.

## Running

### Local environment

#### System dependencies

```
Node: 20x
yarn: v4 (yarn-berry)
```

#### Install nix (preferred)

For a better developer experience we suggest nix usage for mananing the enviroment. Visit this [link](https://nixos.org/download/#download-nix) to download it.

To enable the commands `nix develop` and `nix build` using flakes, add the following to your `/etc/nix/nix.conf` file:

```
experimental-features = nix-command flakes
```

#### Clone the project and install dependencies

```sh
$ git clone https://github.com/HathorNetwork/hathor-rpc-lib.git
```

To initialize nix dev environment:

```sh
$ nix develop
```

then, install the depencies:

```sh
yarn
```

### Tests
After installing the packages, tests can be started from the workspace level by running: 

```sh
yarn tests
```

## Support

If after consulting the documentation, you still need **help to use Hathor RPC library**, [send a message to the `#development` channel on Hathor Discord server for assistance from Hathor team and community members](https://discord.com/channels/566500848570466316/663785995082268713).

If you observe an incorrect behavior while using Hathor RPC library, see [the "Issues" subsection in "Contributing"](#issues).

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
