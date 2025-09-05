import type { NextConfig } from "next";

const API_BASE = process.env.API_BASE_URL || "http://localhost:32101"

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_BASE}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
