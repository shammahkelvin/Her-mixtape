import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // Ensure Turbopack resolves from this project, not a parent folder.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
