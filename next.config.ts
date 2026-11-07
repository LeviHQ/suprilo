import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      {
        source: "/profile/redeem",
        destination: "/profile/referral",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
