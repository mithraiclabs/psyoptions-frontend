const nodeExternals = require('webpack-node-externals')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

const watch = process.env.NODE_ENV !== 'production'
const mode =
  process.env.NODE_ENV === 'production' ? 'production' : 'development'

module.exports = [
  {
    // Server
    entry: './src/server.js',
    watch,
    mode,
    output: {
      filename: 'index.js',
    },
    target: 'node',
    externals: [nodeExternals()],
    module: {
      rules: [
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
      ],
    },
  },
  {
    // Client
    entry: './src/client.js',
    watch,
    mode,
    output: {
      filename: 'public/bundle.js',
    },
    module: {
      rules: [
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
      ],
    },
    plugins: [new NodePolyfillPlugin()],
  },
]
