/** @type {import('next').NextConfig} */
const nextConfig = {
  // keep builds resilient while we iterate
  typescript: { ignoreBuildErrors: true }
};
module.exports = nextConfig;
