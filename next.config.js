/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

const nextConfig = withPWA({
  basePath: "/monocle-rizz",
  output: "export",  // Enables static exports
  reactStrictMode: true,
});

module.exports = nextConfig;
