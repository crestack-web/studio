
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/initializePayment',
        destination: 'https://initializepayment-6kxikgkcjq-uc.a.run.app',
      },
      {
        source: '/api/verifyPayment',
        destination: 'https://verifypayment-6kxikgkcjq-uc.a.run.app',
      },
      {
        source: '/api/fetchBankList',
        destination: 'https://fetchbanklist-6kxikgkcjq-uc.a.run.app',
      },
      {
        source: '/api/verifyBankAccount',
        destination: 'https://verifybankaccount-6kxikgkcjq-uc.a.run.app',
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'gazettengr.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
