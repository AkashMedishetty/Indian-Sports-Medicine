import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: false, // Disable to prevent double-rendering which crashes WebGL
  images: {
    // Disable Vercel image optimization - images are already compressed
    unoptimized: true,
  },
};

export default nextConfig;
