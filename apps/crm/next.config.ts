import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El paquete compartido se publica como TypeScript sin compilar.
  transpilePackages: ["@tinta/compartido"],
  experimental: {
    serverActions: {
      // Las nóminas en PDF (hasta 5 MB) y las fotos del equipo suben por
      // server action; el límite por defecto es 1 MB.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
