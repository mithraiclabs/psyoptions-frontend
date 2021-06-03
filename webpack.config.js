const { ContextReplacementPlugin } = require('webpack')
const nodeExternals = require('webpack-node-externals')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const WebpackAssetsManifest = require('webpack-assets-manifest')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const SentryWebpackPlugin = require('@sentry/webpack-plugin')

const isDev = process.env.NODE_ENV !== 'production'

const watch = isDev
const mode = isDev ? 'development' : 'production'
const devtool = isDev ? 'inline-source-map' : 'source-map'

// Remove nested bn.js that are still on 4.x.x
// Not too worried about breaking changes in 5.x.x based on release notes:
// https://github.com/indutny/bn.js/releases/tag/v5.0.0
const dedupeBnJs = [
  'rm -rf node_modules/elliptic/node_modules/bn.js/',
  'rm -rf node_modules/asn1.js/node_modules/bn.js/',
  'rm -rf node_modules/create-ecdh/node_modules/bn.js/',
  'rm -rf node_modules/diffie-hellman/node_modules/bn.js/',
  'rm -rf node_modules/miller-rabin/node_modules/bn.js/',
  'rm -rf node_modules/public-encrypt/node_modules/bn.js/',
]

const serverPlugins = isDev
  ? [
      new (require('webpack-shell-plugin-next'))({
        onBuildStart: {
          scripts: ['npm run clean', ...dedupeBnJs],
          blocking: true,
          parallel: false,
        },
        onBuildEnd: {
          scripts: ['nodemon dist/index.js'],
          blocking: false,
          parallel: true,
        },
      }),
    ]
  : [
      new (require('webpack-shell-plugin-next'))({
        onBuildStart: {
          scripts: dedupeBnJs,
          blocking: true,
          parallel: false,
        },
      }),
    ]

module.exports = [
  {
    // Server
    entry: './src/server.js',
    watch,
    mode,
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
    },
    output: {
      filename: 'index.js',
      assetModuleFilename: 'public/assets/[hash][ext][query]',
    },
    target: 'node',
    externals: [nodeExternals()],
    module: {
      rules: [
        {
          test: /\.png$/,
          type: 'asset/resource',
        },
        {
          test: /\.m?js$/,
          exclude: /(node_modules)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-react'],
            },
          },
        },
        {
          test: /\.tsx?/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    plugins: serverPlugins,
  },
  {
    // Client
    entry: ['./src/client.js'],
    devtool,
    watch,
    mode,
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
    },
    output: {
      filename: 'public/bundle.[chunkhash].js',
      assetModuleFilename: 'public/assets/[hash][ext][query]',
    },
    module: {
      rules: [
        {
          test: /\.png$/,
          type: 'asset/resource',
        },
        {
          test: /\.m?js$/,
          exclude: /(node_modules)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
            },
          },
        },
        {
          test: /\.tsx?/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new ContextReplacementPlugin(/moment[/\\]locale$/, /en/),
      new NodePolyfillPlugin(),
      new WebpackAssetsManifest({}),
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
      }),
      ...(isDev
        ? []
        : [
            new SentryWebpackPlugin({
              // sentry-cli configuration
              authToken: process.env.SENTRY_AUTH_TOKEN,
              org: 'psyoptions',
              project: 'psyoptions',
              release: `${process.env.SHORT_SHA}${
                (process.env.TAG_NAME && `:${process.env.TAG_NAME}`) || ''
              }`,
              // webpack specific configuration
              include: './dist',
              ignore: ['node_modules', 'webpack.config.js'],
            }),
          ]),
    ],
  },
  {
    // Service worker
    entry: ['./service-worker/rate-limited-fetch-worker.js'],
    devtool,
    watch,
    mode,
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
    },
    output: {
      filename: 'public/rate-limited-fetch-worker.[contenthash].js',
    },
    plugins: [
      new WebpackAssetsManifest({
        output: 'service-worker-manifest.json',
      }),
    ],
  },
]
