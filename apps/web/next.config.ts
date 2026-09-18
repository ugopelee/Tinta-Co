import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El paquete compartido se publica como TypeScript sin compilar.
  transpilePackages: ["@tinta/compartido"],
};

export default nextConfig;
