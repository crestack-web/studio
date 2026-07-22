
import type {NextConfig} from 'next';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function resolveFirebaseProjectId(): string {
  const firebaseConfig = process.env.FIREBASE_CONFIG;
  if (firebaseConfig) {
    try {
      const parsed = JSON.parse(firebaseConfig);
      if (parsed?.projectId) return String(parsed.projectId);
    } catch {
      // ignore
    }
  }

  try {
    const rcPath = join(__dirname, '.firebaserc');
    const rc = JSON.parse(readFileSync(rcPath, 'utf8'));
    const projectId = rc?.projects?.default;
    if (projectId) return String(projectId);
  } catch {
    // ignore
  }

  return process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'bizassistant2-62305643-adad7';
}

const firebaseProjectId = resolveFirebaseProjectId();
const firebaseFunctionsRegion = process.env.FIREBASE_FUNCTIONS_REGION || 'us-central1';
const firebaseFunctionsBaseUrl = `https://${firebaseFunctionsRegion}-${firebaseProjectId}.cloudfunctions.net`;

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  env: {
    GOOGLE_GENAI_API_KEY: process.env.GOOGLE_GENAI_API_KEY,
  },
  async redirects() {
    return [];
  },
  async rewrites() {
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    const rewrites = [
      {
        source: '/api/initializePayment',
        destination: `${firebaseFunctionsBaseUrl}/initializePayment`,
      },
      {
        source: '/api/verifyPayment',
        destination: `${firebaseFunctionsBaseUrl}/verifyPayment`,
      },
      {
        source: '/api/fetchBankList',
        destination: `${firebaseFunctionsBaseUrl}/fetchBankList`,
      },
      {
        source: '/api/verifyBankAccount',
        destination: `${firebaseFunctionsBaseUrl}/verifyBankAccount`,
      },
      {
        source: '/api/sendAdminSignInLink',
        destination: `${firebaseFunctionsBaseUrl}/sendAdminSignInLink`,
      },
      {
        source: '/api/sendStaffSignInLink',
        destination: `${firebaseFunctionsBaseUrl}/sendStaffSignInLink`,
      },
      {
        source: '/api/sendEmailVerification',
        destination: `${firebaseFunctionsBaseUrl}/sendEmailVerification`,
      },
      {
        source: '/api/sendPasswordReset',
        destination: `${firebaseFunctionsBaseUrl}/sendPasswordReset`,
      },
      {
        source: '/api/claimReferral',
        destination: `${firebaseFunctionsBaseUrl}/claimReferral`,
      },
      {
        source: '/api/ensureReferralCode',
        destination: `${firebaseFunctionsBaseUrl}/ensureReferralCode`,
      },
      {
        source: '/api/adminRecordReferralPayout',
        destination: `${firebaseFunctionsBaseUrl}/adminRecordReferralPayout`,
      },
      {
        source: '/api/createProduct',
        destination: `${firebaseFunctionsBaseUrl}/createProduct`,
      },
      {
        source: '/api/getProducts',
        destination: `${firebaseFunctionsBaseUrl}/getProducts`,
      },
      {
        source: '/api/sendOtpLogin',
        destination: `${firebaseFunctionsBaseUrl}/sendOtpLogin`,
      },
    ];

    // Only add PostHog rewrites if NEXT_PUBLIC_POSTHOG_HOST is configured
    if (posthogHost) {
      rewrites.push(
        {
          source: '/ingest/static/:path*',
          destination: `${posthogHost}/static/:path*`,
        },
        {
          source: '/ingest/array/:path*',
          destination: `${posthogHost}/array/:path*`,
        },
        {
          source: '/ingest/:path*',
          destination: `${posthogHost}/:path*`,
        }
      );
    }

    return rewrites;
  },
  // Enable React strict mode for better development
  reactStrictMode: true,
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
        hostname: 'firebasestorage.googleapis.com',
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
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
