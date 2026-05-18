/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["@azure/cosmos", "@azure/search-documents"],
  },
  images: {
    remotePatterns: [
      // Glints company logos served via their image proxy.
      { protocol: "https", hostname: "images.glints.com" },
      {
        protocol: "https",
        hostname: "glints-dashboard.oss-ap-southeast-1.aliyuncs.com",
      },
    ],
  },
};

export default nextConfig;
