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
  // Make images work properly
  images: {
    domains: ['vzndqhzpzdphiiblwplh.supabase.co'],
  },
  // Optimization settings
  swcMinify: true,
  // Disable unnecessary webpack transformations
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /node_modules\/@supabase\/realtime-js/ }
    ];
    return config;
  },
}

export default nextConfig;
