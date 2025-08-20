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
  // Optimize for Vercel
  compress: true,
  poweredByHeader: false,
}

export default nextConfig
