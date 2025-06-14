/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vzndqhzpzdphiiblwplh.supabase.co',
      },
    ],
  }
}

export default nextConfig
