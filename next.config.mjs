/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['@supabase/supabase-js'],
  experimental: {
    // Remove deprecated serverComponentsExternalPackages
  },
  api: {
    bodyParser: {
      sizeLimit: false, // No size limit for file uploads
    },
    responseLimit: false,
  },
  serverRuntimeConfig: {
    // Increase timeout for large file processing
    maxDuration: 1800, // 30 minutes in seconds
  },
}

export default nextConfig
