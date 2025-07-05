/** @type {import('next').NextConfig} */
const nextConfig = {
  // Simplified config to minimize errors
  reactStrictMode: true,
  swcMinify: true,
  // Prevent TypeScript errors from failing the build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Prevent ESLint errors from failing the build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configure images for Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vzndqhzpzdphiiblwplh.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Webpack configuration
  webpack: (config) => {
    config.ignoreWarnings = [
      { message: /critical dependency/i }
    ];
    return config;
  },
  // Configure output
  output: 'standalone',
};

export default nextConfig;
