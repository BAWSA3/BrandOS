import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactCompiler: true,
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

  // Hide source maps from browser devtools
  hideSourceMaps: true,

  // Automatically tree-shake Sentry SDK
  disableLogger: true,
});
