let withBundleAnalyzer = (config) => config;

try {
  withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
  });
} catch {
  // Keep builds working until the dependency is installed locally.
}

let withSentryConfig = (config) => config;

try {
  const { withSentryConfig: sentryConfig } = require("@sentry/nextjs");
  withSentryConfig = (config) =>
    sentryConfig(config, {
      // Suppresses source map upload logs during build.
      silent: true,
      // Upload source maps only in CI/production to avoid local leaks.
      disableSourceMapUpload: !process.env.CI,
      // Automatically instrument server components and API routes.
      autoInstrumentServerFunctions: true,
    });
} catch {
  // Keep builds working until @sentry/nextjs is installed.
}

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=()",
  },
];

/**
 * Bundle size notes:
 * - Before: landing page First Load JS was 142 kB per issue #160.
 * - After: dynamic-loading `three` in `DottedSurface` should reduce the initial `/` bundle once `ANALYZE=true npm run analyze` is run in an installed environment.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = withSentryConfig(withBundleAnalyzer(nextConfig));
