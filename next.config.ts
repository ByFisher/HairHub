import type { NextConfig } from "next";

const laravelApiUrl =
  process.env.LARAVEL_API_URL?.replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:8001";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.56.1", "localhost", "127.0.0.1"],
  reactCompiler: true,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${laravelApiUrl}/api/:path*` },
      { source: "/sanctum/:path*", destination: `${laravelApiUrl}/sanctum/:path*` },
    ];
  },
};

export default nextConfig;
