
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
  async rewrites() {
    // This is to proxy the Cloud Functions in local development.
    // In production, Firebase Hosting rewrites will handle this.
    if (process.env.NODE_ENV !== 'development') {
      return [];
    }

    if (!process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL) {
      console.warn(
        'NEXT_PUBLIC_FUNCTIONS_BASE_URL is not set in .env file. Local function calls will fail.'
      );
      return [];
    }

    return [
      {
        source: '/initializePayment',
        destination: `${process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL}/initializePayment`,
      },
      {
        source: '/verifyPayment',
        destination: `${process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL}/verifyPayment`,
      },
      {
        source: '/fetchBankList',
        destination: `${process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL}/fetchBankList`,
      },
      {
        source: '/verifyBankAccount',
        destination: `${process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL}/verifyBankAccount`,
      },
    ];
  },
};

export default nextConfig;
