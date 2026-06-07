import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['msnodesqlv8', 'mssql'],
  allowedDevOrigins: ['192.168.240.32', '192.168.240.32:3000', 'localhost', 'localhost:3000'],
};

export default nextConfig;
