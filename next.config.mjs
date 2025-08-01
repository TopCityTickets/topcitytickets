/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    nodeMiddleware: true,
  },
  images: {
    domains: ['localhost', 'example.com'], // Add any image domains you need
  },
}

export default nextConfig;
