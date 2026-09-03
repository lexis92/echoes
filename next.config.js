/** @type {import('next').NextConfig} */
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321").hostname;
  } catch {
    return "localhost";
  }
})();

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), interest-cohort=(), microphone=(self)" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Deliberately narrow. A script-src needs per-request nonces to cover the
    // inline theme script and the styles the animation library emits, and
    // getting that wrong breaks the page silently rather than failing loudly.
    // These directives need no nonce and still close the gaps that do not
    // depend on script injection: no plugins, no <base> rewriting, no posting
    // this app's forms to another origin, and no framing at all
    // (frame-ancestors is the header-level replacement for X-Frame-Options).
    // React escapes every piece of user content, and nothing renders message
    // text as raw HTML, so script injection has no route in today.
    key: "Content-Security-Policy",
    value: [
      // No default-src on purpose: it is the fallback for script-src,
      // style-src, font-src and connect-src, so 'self' alone would block the
      // inline theme script, the webfonts and every Supabase call.
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // This app lives in a subdirectory of a repository that has its own
  // lockfile at the root; pin the root so Next does not guess.
  turbopack: { root: __dirname },
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost },
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
