/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.VERCEL ? undefined : 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  async rewrites() {
    return [
      { source: '/teacher', destination: '/' },
      { source: '/teacher/', destination: '/' },
      { source: '/explore', destination: '/' },
      { source: '/explore/', destination: '/' },
      { source: '/tools', destination: '/' },
      { source: '/tools/', destination: '/' },
      { source: '/test', destination: '/' },
      { source: '/test/', destination: '/' },
      { source: '/analysis', destination: '/' },
      { source: '/analysis/', destination: '/' },
      { source: '/profile', destination: '/' },
      { source: '/profile/', destination: '/' },
      { source: '/battle', destination: '/' },
      { source: '/battle/', destination: '/' },
      { source: '/rewards', destination: '/' },
      { source: '/rewards/', destination: '/' },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ],
      },
    ];
  },
};

export default nextConfig;
