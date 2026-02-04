
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/initializePayment',
        destination: process.env.NEXT_PUBLIC_INITIALIZE_PAYMENT_URL || '',
      },
      {
        source: '/api/verifyPayment',
        destination: process.env.NEXT_PUBLIC_VERIFY_PAYMENT_URL || '',
      },
      {
        source: '/api/fetchBankList',
        destination: process.env.NEXT_PUBLIC_FETCH_BANK_LIST_URL || '',
      },
      {
        source: '/api/verifyBankAccount',
        destination: process.env.NEXT_PUBLIC_VERIFY_BANK_ACCOUNT_URL || '',
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
