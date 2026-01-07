import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    return config;
  },

  // Silences Turbopack warning
  turbopack: {},
};

export default nextConfig;
