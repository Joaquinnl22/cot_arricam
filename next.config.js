// next.config.js
const nextConfig = {
  webpack(config, options) {
    config.module.rules.push({
      test: /\.map$/,
      use: 'ignore-loader',
    });
    
    // Configuración para Vercel
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
};

module.exports = nextConfig;
