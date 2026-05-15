import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress the Plotly.js "Can't resolve 'canvas'" warning (it's optional)
  webpack(config) {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
