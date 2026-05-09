import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  serverExternalPackages: ['playwright', 'playwright-extra', 'puppeteer-extra-plugin-stealth'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'linkedin.com' },
      { protocol: 'https', hostname: '*.linkedin.com' },
      { protocol: 'https', hostname: 'greenhouse.io' },
      { protocol: 'https', hostname: '*.greenhouse.io' },
      { protocol: 'https', hostname: 'lever.co' },
      { protocol: 'https', hostname: '*.lever.co' },
      { protocol: 'https', hostname: 'glassdoor.com' },
      { protocol: 'https', hostname: '*.glassdoor.com' },
      { protocol: 'https', hostname: 'indeed.com' },
      { protocol: 'https', hostname: '*.indeed.com' },
      { protocol: 'https', hostname: 'wellfound.com' },
      { protocol: 'https', hostname: '*.wellfound.com' },
      { protocol: 'https', hostname: 'ycombinator.com' },
      { protocol: 'https', hostname: '*.ycombinator.com' },
    ],
  },
};

export default nextConfig;
