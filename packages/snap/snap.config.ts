import type { SnapConfig } from '@metamask/snaps-cli';
import { merge } from '@metamask/snaps-cli';
import { resolve } from 'path';
import * as webpack from 'webpack';
import stdLibBrowser from 'node-stdlib-browser';

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
        crypto: stdLibBrowser.crypto,
        stream: stdLibBrowser.stream,
        buffer: require.resolve('buffer'),
        process: stdLibBrowser.process,
        path: stdLibBrowser.path,
        fs: false,
        util: stdLibBrowser.util,
        assert: stdLibBrowser.assert,
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