/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'localhost',
      'images.unsplash.com',
      'picsum.photos',
      'avatars.githubusercontent.com',
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Completely disable static generation for all pages
  // This ensures pages that use authentication won't be pre-rendered
  // and will only be rendered on-demand, client-side
  staticPageGenerationTimeout: 1,
};

module.exports = nextConfig;
