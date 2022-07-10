/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    domains: ['icons.duckduckgo.com'],
  },
  reactStrictMode: true,
  webpack: (config, { dev, isServer }) => {
    // Replace React with Preact only in client production build
    // if (!dev && !isServer) {
    //   Object.assign(config.resolve.alias, {
    //     react: 'preact/compat',
    //     'react-dom/test-utils': 'preact/test-utils',
    //     'react-dom': 'preact/compat',
    //   });
    // }

    return config;
  },
};
