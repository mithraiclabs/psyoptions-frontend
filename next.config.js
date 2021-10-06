const withPlugins = require('next-compose-plugins');
const withTM = require('next-transpile-modules')([
  '@project-serum/sol-wallet-adapter',
]);

module.exports = withPlugins([withTM], {
  typescript: {
    // TODO undo this
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
      };
    }

    return config;
  },
});
