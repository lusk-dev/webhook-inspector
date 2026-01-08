import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable static exports for Cloudflare Pages
  // output: 'export', // Uncomment if using static export mode

  // Cloudflare Workers compatibility
  experimental: {
    // Enable Edge Runtime for API routes
    runtime: 'edge',
  },
}

export default nextConfig
