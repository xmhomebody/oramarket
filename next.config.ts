import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 关闭严格模式：首页采用命令式初始化（Chart.js/定时器/无限滚动），
  // 避免开发环境下 effect 双调用导致图表与卡片重复渲染。
  reactStrictMode: false,

  // 允许局域网设备访问开发服务器。Next.js 16 默认会阻断跨源（非 localhost）
  // 访问 /_next/* 与 HMR WebSocket，导致页面骨架能渲染但客户端 JS 不执行
  // （计数器停在 0、图表空白、列表不加载）。把本机局域网网段加入白名单即可。
  allowedDevOrigins: ["192.168.5.*"],
};

export default nextConfig;
