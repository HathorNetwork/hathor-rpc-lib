const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const LavaMoatPlugin = require('@lavamoat/webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const stdLibBrowser = require('node-stdlib-browser');

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
        'buffer': require.resolve('buffer/'),
        'assert': stdLibBrowser.assert,
        'crypto': stdLibBrowser.crypto,
        'path': stdLibBrowser.path,
        'process': stdLibBrowser.process,
        'stream': stdLibBrowser.stream,
        'os': stdLibBrowser.os,
        'events': stdLibBrowser.events,
        'util': stdLibBrowser.util,
        'zlib': stdLibBrowser.zlib,
        'vm': false,
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime')
      },
      fallback: {
        ...stdLibBrowser
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
      ...(isProduction ? [new LavaMoatPlugin({
        mode: 'production',
        generatePolicy: true,
        policyLocation: path.resolve(__dirname, 'lavamoat/webpack'),
        policyOverride: path.resolve(__dirname, 'lavamoat/webpack/policy-override.json'),
        HtmlWebpackPluginInterop: true,
        readableResourceIds: true,
      })] : []),
      new HtmlWebpackPlugin({
        template: './index.html',
        inject: 'body',
      }),
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
      new NodePolyfillPlugin({
        includeAliases: ['Buffer']
      }),
      new MiniCssExtractPlugin({
        filename: isProduction ? '[name].[contenthash].css' : '[name].css'
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'public',
            to: '.',
            globOptions: {
              ignore: ['**/index.html'],
            },
          },
        ],
      }),
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
