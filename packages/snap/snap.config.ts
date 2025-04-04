import type { SnapConfig } from '@metamask/snaps-cli';
import { merge } from '@metamask/snaps-cli';
import { resolve } from 'path';

const config: SnapConfig = {
  bundler: 'webpack',
  customizeWebpackConfig: (config) => merge(config, {
    mode: 'development',
    devtool: 'source-map',
    optimization: {
       minimize: false
    },
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