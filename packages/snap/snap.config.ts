import type { SnapConfig } from '@metamask/snaps-cli';
import { merge } from '@metamask/snaps-cli';
import { resolve } from 'path';
import * as webpack from 'webpack';

const config: SnapConfig = {
  bundler: 'webpack',
  customizeWebpackConfig: (config) => merge(config, {
    mode: 'development',
    devtool: 'source-map',
    optimization: {
       minimize: false
    },
    resolve: {
      fallback: {
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        process: require.resolve('process/browser'),
        path: require.resolve('path-browserify'),
        fs: false,
        util: require.resolve('util'),
        assert: require.resolve('assert/'),
      },
    },
    plugins: [
      ...(config.plugins || []),
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
      new webpack.DefinePlugin({
        'process.browser': true,
      }),
    ],
  }),
  input: resolve(__dirname, 'src/index.tsx'),
  server: {
    port: 8080,
  },
  polyfills: true,
  environment: {
    NODE_ENV: 'development',
  },
};

export default config;
