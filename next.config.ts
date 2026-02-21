import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["motion-plus", "motion-plus-dom"],
};

export default withSentryConfig(nextConfig, {
  // Sentry options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Suppress source map upload logs
  silent: true,

  // Upload source maps for better error traces
  widenClientFileUpload: true,

  // Route browser requests to Sentry through Next.js rewrite
  tunnelRoute: "/monitoring",

  // Source map settings
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Automatically tree-shake Sentry SDK debug statements
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },
});
