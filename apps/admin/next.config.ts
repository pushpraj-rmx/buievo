import type { NextConfig } from "next";

const API_BASE = process.env.API_BASE_URL || "https://was.nmpinfotech.com";
// const API_BASE = process.env.API_BASE_URL || "https://was.nmpinfotech.com";

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
