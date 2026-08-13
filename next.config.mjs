/** @type {import('next').NextConfig} */

// En-tetes de securite appliques a toutes les reponses.
// NB : la Content-Security-Policy n'est volontairement PAS forcee ici pour ne pas
// casser styled-jsx, les polices, les scripts CDN (jsPDF) ni les appels Supabase/Brevo.
// A deployer dans un second temps en mode report-only avant application stricte.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
