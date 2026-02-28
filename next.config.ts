import type { NextConfig } from "next";
import path from "node:path";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  turbopack: {},
  allowedDevOrigins: ["192.168.68.107", "localhost"],
  // Fix Netlify: avoid wrong root from parent lockfiles; ensure correct module resolution
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "t3.storageapi.dev" },
      { protocol: "https", hostname: "**.storageapi.dev" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.tigris.dev" },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@": path.resolve(__dirname, "src"),
    };
    return config;
  },
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https?:\/\/[^/]+\/api\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "yukchi-api-cache",
          expiration: { maxEntries: 100, maxAgeSeconds: 10 * 60 },
          networkTimeoutSeconds: 10,
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
})(nextConfig);
