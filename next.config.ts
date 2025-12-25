import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io"
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  }
  ,
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/inventory',
        permanent: false,
      },
    ]
  }
}

export default nextConfig
