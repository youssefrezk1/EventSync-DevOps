import type { NextConfig } from "next";

const backendUrl =
  process.env.BACKEND_INTERNAL_URL || "http://backend-service:4000";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  turbopack: {
    root: __dirname,
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/auth/:path*",
        destination: `${backendUrl}/auth/:path*`,
      },
      {
        source: "/admin/:path*",
        destination: `${backendUrl}/admin/:path*`,
      },
      {
        source: "/event-office/:path*",
        destination: `${backendUrl}/event-office/:path*`,
      },
      {
        source: "/eventOffice/:path*",
        destination: `${backendUrl}/eventOffice/:path*`,
      },
      {
        source: "/event-office2/:path*",
        destination: `${backendUrl}/event-office2/:path*`,
      },
      {
        source: "/court/:path*",
        destination: `${backendUrl}/court/:path*`,
      },
      {
        source: "/exports/:path*",
        destination: `${backendUrl}/exports/:path*`,
      },
      {
        source: "/dummy/:path*",
        destination: `${backendUrl}/dummy/:path*`,
      },
      {
        source: "/bazaarbyid/:path*",
        destination: `${backendUrl}/bazaarbyid/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
      {
        source: "/restraunt/:path*",
        destination: `${backendUrl}/restraunt/:path*`,
      },
      {
        source: "/cart/:path*",
        destination: `${backendUrl}/cart/:path*`,
      },
    ];
  },
};

export default nextConfig;
