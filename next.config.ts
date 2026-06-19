import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "1mb"
    }
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // La camara solo se usa en el escaner de caseta; el resto de permisos se niega.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "off" }
        ]
      }
    ];
    // TODO security-hardening: agregar Content-Security-Policy con nonce. Se difiere
    // para no romper Supabase Auth, las imagenes data: del QR ni la camara (html5-qrcode).
    // Requiere pruebas dedicadas con todos los flujos antes de activarla.
  }
};

export default nextConfig;
