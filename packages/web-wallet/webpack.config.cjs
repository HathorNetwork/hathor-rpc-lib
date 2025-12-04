const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const LavaMoatPlugin = require('@lavamoat/webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/main.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      clean: true,
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs'],
      modules: [
        path.resolve(__dirname, 'node_modules'),
        'node_modules'
      ],
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@hathor/snap-utils': path.resolve(__dirname, '../snap-utils/src'),
        'events': path.resolve(__dirname, 'node_modules/events'),
        'buffer': path.resolve(__dirname, 'node_modules/buffer'),
        'process/browser': path.resolve(__dirname, 'node_modules/process/browser.js'),
        'assert': path.resolve(__dirname, 'node_modules/assert'),
        'crypto': path.resolve(__dirname, 'node_modules/crypto-browserify'),
        'stream': path.resolve(__dirname, 'node_modules/stream-browserify'),
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime')
      },
      fallback: {
        'buffer': require.resolve('buffer/'),
        'crypto': require.resolve('crypto-browserify'),
        'stream': require.resolve('stream-browserify'),
        'assert': require.resolve('assert/'),
        'process': require.resolve('process/browser')
      },
      // Fix ESM module resolution issues
      fullySpecified: false,
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                ['@babel/preset-react', { runtime: 'automatic' }],
                '@babel/preset-typescript'
              ]
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader'
          ]
        },
        {
          test: /\.svg$/,
          type: 'asset/resource'
        },
        {
          test: /\.(png|jpg|jpeg|gif|ico)$/,
          type: 'asset/resource'
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.SNAP_ORIGIN': JSON.stringify(process.env.SNAP_ORIGIN || 'local:http://localhost:8080'),
        'process.env.LOG_LEVEL': JSON.stringify(process.env.LOG_LEVEL || 'debug'),
        'process.env': JSON.stringify({
          SNAP_ORIGIN: process.env.SNAP_ORIGIN || 'local:http://localhost:8080',
          LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
          NODE_ENV: isProduction ? 'production' : 'development',
        }),
      }),
      new webpack.NormalModuleReplacementPlugin(
        /^\/.*\/node_modules\/node-stdlib-browser\/node_modules\/buffer$/,
        path.resolve(__dirname, 'node_modules/buffer/index.js')
      ),
      new HtmlWebpackPlugin({
        template: './index.html',
        inject: 'body',
      }),
      new NodePolyfillPlugin({
        includeAliases: ['Buffer']
      }),
      new MiniCssExtractPlugin({
        filename: isProduction ? '[name].[contenthash].css' : '[name].css'
      }),
      // Re-enabled LavaMoat after replacing date-fns with native date inputs
      ...(isProduction ? [new LavaMoatPlugin({
        generatePolicy: true,
        policyLocation: path.resolve(__dirname, 'lavamoat/webpack'),
        policyOverride: path.resolve(__dirname, 'lavamoat/webpack/policy-override.json'),
        HtmlWebpackPluginInterop: true,
        readableResourceIds: true,
      })] : []),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      port: 5173,
      hot: true,
      historyApiFallback: true,
      allowedHosts: 'all',
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    optimization: {
      // LavaMoat requires module concatenation to be disabled
      concatenateModules: false,
    },
  };
};
