import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const exporting = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(exporting ? { output: "export", basePath, trailingSlash: true, images: { unoptimized: true } } : { cacheComponents: true, partialPrefetching: true }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
