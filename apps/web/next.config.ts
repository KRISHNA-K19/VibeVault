import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow any HTTPS domain for simplicity since supabase projectId is dynamic
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '54321', // Local supabase development port
      }
    ],
  },
};

export default nextConfig;
