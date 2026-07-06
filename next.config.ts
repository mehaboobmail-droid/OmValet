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
  // Keep firebase-admin as an external node module (not bundled) — it has
  // dynamic requires and native deps. It pulls in an ESM-only dep (jose via
  // jwks-rsa), so the serverless runtime must be Node >= 22.12 for require(esm);
  // that is pinned in package.json engines.
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
