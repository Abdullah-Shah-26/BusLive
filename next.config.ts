import type { NextConfig } from "next";

// Polyfill localStorage for Genkit if needed
if (
  typeof global.localStorage === "undefined" ||
  typeof global.localStorage.getItem !== "function"
) {
  (global as any).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };
}

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "a.tile.openstreetmap.org",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "b.tile.openstreetmap.org",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "c.tile.openstreetmap.org",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "a.basemaps.cartocdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "b.basemaps.cartocdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "c.basemaps.cartocdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn-icons-png.flaticon.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_OPENROUTESERVICE_API_KEY: process.env.OPENROUTESERVICE_API_KEY,
  },
};

export default nextConfig;
