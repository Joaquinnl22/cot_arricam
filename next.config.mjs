// next.config.js
const nextConfig = {
  webpack(config, options) {
    config.module.rules.push({
      test: /\.map$/,
      use: 'ignore-loader',
    });
    return config;
  },
};

module.exports = nextConfig;
