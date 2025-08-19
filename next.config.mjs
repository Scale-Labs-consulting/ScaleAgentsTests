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
    // Optimize for performance
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
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
  // Optimize for Vercel
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
}

export default nextConfig
