import type { NextConfig } from "next";

const securityHeaders = [
  // The portal and guest flow must never render inside a foreign frame.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // firebase-admin uses dynamic requires / optional native deps that break when
  // bundled into a serverless function. Load it as an external node module so
  // Vercel traces it correctly (fixes 500s on all API routes).
  serverExternalPackages: ["firebase-admin"],
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // Keep legacy HTML URLs working (previously handled in netlify.toml).
  async redirects() {
    return [
      { source: "/guest.html", destination: "/guest", permanent: true },
      { source: "/portal.html", destination: "/portal", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/login.html", destination: "/login", permanent: true },
    ];
  },
};

export default nextConfig;
