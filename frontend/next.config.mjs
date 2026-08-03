/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["react-icons"],
  },
};

export default nextConfig;
