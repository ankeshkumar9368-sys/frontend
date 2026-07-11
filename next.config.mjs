/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.VERCEL ? undefined : 'export',
  images: {
    unoptimized: true,
  },
  // We need this for Capacitor to work correctly with routing
  trailingSlash: true,
};

export default nextConfig;
