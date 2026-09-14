import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async rewrites() {
    return [
      { source: "/erp", destination: "http://127.0.0.1:8002/" },
      { source: "/erp/:path*", destination: "http://127.0.0.1:8002/:path*" },
      { source: "/assets/:path*", destination: "http://127.0.0.1:8002/assets/:path*" },
      { source: "/brand/:path*", destination: "http://127.0.0.1:8002/brand/:path*" },
      { source: "/api/v1/:path*", destination: "http://127.0.0.1:8002/api/v1/:path*" },
      { source: "/api/:path*", destination: "http://127.0.0.1:8000/api/:path*" },
    ];
  },
};

export default nextConfig;
