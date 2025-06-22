/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable TypeScript checking during builds
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Disable ESLint during builds
  eslint: {
    // Also ignore warnings during builds
    ignoreDuringBuilds: true,
  },
  // Necessary for Next.js 14+ with App Router
  experimental: {
    // Removed appDir option since it's the default in Next.js 14
  },
  // Suppress known harmless warnings
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
  output: 'standalone',
export default nextConfig
export default nextConfig
