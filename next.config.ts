import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config: any) => {
    // Exclude node-specific modules from client bundle
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      dns: false,
      tls: false,
      child_process: false,
    };
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['pg'],
  },
};

export default nextConfig;
