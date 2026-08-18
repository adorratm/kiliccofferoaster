import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ['echarts', 'echarts-for-react', 'zrender'],
};

export default nextConfig;
