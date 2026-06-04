import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 关闭严格模式：首页采用命令式初始化（Chart.js/定时器/无限滚动），
  // 避免开发环境下 effect 双调用导致图表与卡片重复渲染。
  reactStrictMode: false,
};

export default nextConfig;
