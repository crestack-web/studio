/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // This ensures the app is built for static hosting
  trailingSlash: true,
  images: {
    unoptimized: true // Required for export
  },
  async redirects() {
    return [
      {
        source: '/sell',
        destination: '/seller',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;