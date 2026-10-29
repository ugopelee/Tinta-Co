import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El paquete compartido se publica como TypeScript sin compilar.
  transpilePackages: ["@tinta/compartido"],
  experimental: {
    serverActions: {
      // Las nóminas en PDF (hasta 5 MB), las fotos del equipo y las facturas
      // de proveedor (hasta 10 MB, de una en una) suben por server action; el
      // límite por defecto es 1 MB. El margen cubre la cabecera multipart.
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;
