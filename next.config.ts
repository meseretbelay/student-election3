import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.watchOptions = {
      ignored: [
        "**/C:/hiberfil.sys",
        "**/C:/pagefile.sys",
      ],
    };
    return config;
  },
};

export default nextConfig;
