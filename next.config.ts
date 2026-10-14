import type { NextConfig } from "next";

const configuredLaravelApiUrl = process.env.LARAVEL_API_URL?.trim().replace(/\/+$/, "");

if (process.env.NODE_ENV === "production" && !configuredLaravelApiUrl) {
  throw new Error("LARAVEL_API_URL is required to build the production frontend.");
}

const laravelApiUrl = configuredLaravelApiUrl || "http://localhost:8001";

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
